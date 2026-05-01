;; WebAssembly Text Format for High-Performance Audio Processing
;; This provides ultra-low latency audio processing using SIMD instructions

(module
  ;; Import memory from JavaScript
  (import "env" "memory" (memory 1))
  
  ;; Import math functions
  (import "env" "sin" (func $sin (param f32) (result f32)))
  (import "env" "cos" (func $cos (param f32) (result f32)))
  (import "env" "log" (func $log (param f32) (result f32)))
  (import "env" "pow" (func $pow (param f32 f32) (result f32)))
  
  ;; Constants
  (global $PI f32 (f32.const 3.14159265359))
  (global $TWO_PI f32 (f32.const 6.28318530718))
  (global $SAMPLE_RATE f32 (f32.const 44100.0))
  
  ;; Filter state variables (stored in memory)
  (global $filter_x1 (mut f32) (f32.const 0.0))
  (global $filter_x2 (mut f32) (f32.const 0.0))
  (global $filter_y1 (mut f32) (f32.const 0.0))
  (global $filter_y2 (mut f32) (f32.const 0.0))
  
  ;; Compressor state
  (global $compressor_envelope (mut f32) (f32.const 0.0))
  
  ;; Delay buffer (starts at memory offset 0)
  (global $delay_buffer_size i32 (i32.const 44100)) ;; 1 second at 44.1kHz
  (global $delay_write_index (mut i32) (i32.const 0))
  
  ;; Fast sine approximation using Taylor series
  (func $fast_sin (param $x f32) (result f32)
    (local $x2 f32)
    (local $x3 f32)
    (local $x5 f32)
    
    ;; Normalize to [-PI, PI]
    (local.set $x (f32.sub (local.get $x) 
                          (f32.mul (f32.floor (f32.div (f32.add (local.get $x) (global.get $PI)) 
                                                       (global.get $TWO_PI))) 
                                   (global.get $TWO_PI))))
    
    ;; Taylor series: sin(x) ≈ x - x³/6 + x⁵/120
    (local.set $x2 (f32.mul (local.get $x) (local.get $x)))
    (local.set $x3 (f32.mul (local.get $x2) (local.get $x)))
    (local.set $x5 (f32.mul (local.get $x3) (local.get $x2)))
    
    (f32.add (local.get $x)
             (f32.add (f32.mul (local.get $x3) (f32.const -0.16666667))
                      (f32.mul (local.get $x5) (f32.const 0.00833333))))
  )
  
  ;; Biquad filter implementation
  (func $biquad_filter (param $input f32) (param $b0 f32) (param $b1 f32) (param $b2 f32) 
                       (param $a1 f32) (param $a2 f32) (result f32)
    (local $output f32)
    
    ;; Calculate output: y[n] = b0*x[n] + b1*x[n-1] + b2*x[n-2] - a1*y[n-1] - a2*y[n-2]
    (local.set $output 
      (f32.sub
        (f32.add
          (f32.add
            (f32.mul (local.get $input) (local.get $b0))
            (f32.mul (global.get $filter_x1) (local.get $b1)))
          (f32.mul (global.get $filter_x2) (local.get $b2)))
        (f32.add
          (f32.mul (global.get $filter_y1) (local.get $a1))
          (f32.mul (global.get $filter_y2) (local.get $a2)))))
    
    ;; Update delay line
    (global.set $filter_x2 (global.get $filter_x1))
    (global.set $filter_x1 (local.get $input))
    (global.set $filter_y2 (global.get $filter_y1))
    (global.set $filter_y1 (local.get $output))
    
    (local.get $output)
  )
  
  ;; Compressor with envelope follower
  (func $compressor (param $input f32) (param $threshold f32) (param $ratio f32) 
                   (param $attack f32) (param $release f32) (result f32)
    (local $input_level f32)
    (local $input_db f32)
    (local $gain_reduction f32)
    (local $target_envelope f32)
    (local $rate f32)
    (local $gain_linear f32)
    
    ;; Calculate input level
    (local.set $input_level (f32.abs (local.get $input)))
    
    ;; Convert to dB (simplified)
    (local.set $input_db 
      (f32.select 
        (f32.mul (f32.const 20.0) (call $log (local.get $input_level)))
        (f32.const -100.0)
        (f32.gt (local.get $input_level) (f32.const 0.0))))
    
    ;; Calculate gain reduction
    (local.set $gain_reduction
      (f32.select
        (f32.mul 
          (f32.sub (local.get $input_db) (local.get $threshold))
          (f32.sub (f32.const 1.0) (f32.div (f32.const 1.0) (local.get $ratio))))
        (f32.const 0.0)
        (f32.gt (local.get $input_db) (local.get $threshold))))
    
    ;; Apply envelope follower
    (local.set $target_envelope (local.get $gain_reduction))
    (local.set $rate 
      (f32.select 
        (local.get $attack) 
        (local.get $release)
        (f32.gt (local.get $target_envelope) (global.get $compressor_envelope))))
    
    (global.set $compressor_envelope
      (f32.add (global.get $compressor_envelope)
               (f32.mul (f32.sub (local.get $target_envelope) (global.get $compressor_envelope))
                        (local.get $rate))))
    
    ;; Convert back to linear gain
    (local.set $gain_linear 
      (call $pow (f32.const 10.0) (f32.div (f32.neg (global.get $compressor_envelope)) (f32.const 20.0))))
    
    ;; Apply gain
    (f32.mul (local.get $input) (local.get $gain_linear))
  )
  
  ;; Delay effect
  (func $delay (param $input f32) (param $delay_time f32) (param $feedback f32) (param $wet_level f32) (result f32)
    (local $delay_samples i32)
    (local $read_index i32)
    (local $delayed_sample f32)
    (local $feedback_sample f32)
    (local $write_address i32)
    (local $read_address i32)
    
    ;; Calculate delay in samples
    (local.set $delay_samples (i32.trunc_f32_s (f32.mul (local.get $delay_time) (global.get $SAMPLE_RATE))))
    
    ;; Calculate read index
    (local.set $read_index 
      (i32.sub (global.get $delay_write_index) (local.get $delay_samples)))
    
    ;; Wrap read index
    (if (i32.lt_s (local.get $read_index) (i32.const 0))
      (then (local.set $read_index 
              (i32.add (local.get $read_index) (global.get $delay_buffer_size)))))
    
    ;; Read delayed sample
    (local.set $read_address (i32.mul (local.get $read_index) (i32.const 4))) ;; 4 bytes per float
    (local.set $delayed_sample (f32.load (local.get $read_address)))
    
    ;; Calculate feedback
    (local.set $feedback_sample (f32.mul (local.get $delayed_sample) (local.get $feedback)))
    
    ;; Write new sample with feedback
    (local.set $write_address (i32.mul (global.get $delay_write_index) (i32.const 4)))
    (f32.store (local.get $write_address) (f32.add (local.get $input) (local.get $feedback_sample)))
    
    ;; Update write index
    (global.set $delay_write_index 
      (i32.rem_u (i32.add (global.get $delay_write_index) (i32.const 1)) (global.get $delay_buffer_size)))
    
    ;; Mix wet and dry signals
    (f32.add (local.get $input) (f32.mul (local.get $delayed_sample) (local.get $wet_level)))
  )
  
  ;; SIMD-optimized audio processing for multiple samples
  (func $process_audio_simd (param $input_ptr i32) (param $output_ptr i32) (param $length i32)
                           (param $gain f32) (param $filter_enabled i32)
    (local $i i32)
    (local $input_vec v128)
    (local $output_vec v128)
    (local $gain_vec v128)
    
    ;; Create gain vector
    (local.set $gain_vec (f32x4.splat (local.get $gain)))
    
    ;; Process 4 samples at a time using SIMD
    (local.set $i (i32.const 0))
    (loop $simd_loop
      (if (i32.lt_u (local.get $i) (i32.sub (local.get $length) (i32.const 3)))
        (then
          ;; Load 4 samples
          (local.set $input_vec (v128.load (i32.add (local.get $input_ptr) (i32.mul (local.get $i) (i32.const 4)))))
          
          ;; Apply gain
          (local.set $output_vec (f32x4.mul (local.get $input_vec) (local.get $gain_vec)))
          
          ;; Store 4 samples
          (v128.store (i32.add (local.get $output_ptr) (i32.mul (local.get $i) (i32.const 4))) (local.get $output_vec))
          
          ;; Increment by 4
          (local.set $i (i32.add (local.get $i) (i32.const 4)))
          (br $simd_loop)
        )
      )
    )
    
    ;; Process remaining samples
    (loop $remaining_loop
      (if (i32.lt_u (local.get $i) (local.get $length))
        (then
          (f32.store 
            (i32.add (local.get $output_ptr) (i32.mul (local.get $i) (i32.const 4)))
            (f32.mul 
              (f32.load (i32.add (local.get $input_ptr) (i32.mul (local.get $i) (i32.const 4))))
              (local.get $gain)))
          
          (local.set $i (i32.add (local.get $i) (i32.const 1)))
          (br $remaining_loop)
        )
      )
    )
  )
  
  ;; Main audio processing function
  (func $process_audio (param $input_ptr i32) (param $output_ptr i32) (param $length i32)
                       (param $gain f32) (param $filter_freq f32) (param $filter_q f32)
                       (param $comp_threshold f32) (param $comp_ratio f32)
                       (param $delay_time f32) (param $delay_feedback f32) (param $delay_wet f32)
    (local $i i32)
    (local $input_sample f32)
    (local $output_sample f32)
    (local $omega f32)
    (local $sin_omega f32)
    (local $cos_omega f32)
    (local $alpha f32)
    (local $b0 f32) (local $b1 f32) (local $b2 f32)
    (local $a1 f32) (local $a2 f32)
    
    ;; Calculate filter coefficients (lowpass)
    (local.set $omega (f32.div (f32.mul (global.get $TWO_PI) (local.get $filter_freq)) (global.get $SAMPLE_RATE)))
    (local.set $sin_omega (call $fast_sin (local.get $omega)))
    (local.set $cos_omega (call $fast_sin (f32.sub (f32.div (global.get $PI) (f32.const 2.0)) (local.get $omega))))
    (local.set $alpha (f32.div (local.get $sin_omega) (f32.mul (f32.const 2.0) (local.get $filter_q))))
    
    ;; Lowpass filter coefficients
    (local.set $b0 (f32.div (f32.sub (f32.const 1.0) (local.get $cos_omega)) (f32.const 2.0)))
    (local.set $b1 (f32.sub (f32.const 1.0) (local.get $cos_omega)))
    (local.set $b2 (f32.div (f32.sub (f32.const 1.0) (local.get $cos_omega)) (f32.const 2.0)))
    (local.set $a1 (f32.div (f32.mul (f32.const -2.0) (local.get $cos_omega)) (f32.add (f32.const 1.0) (local.get $alpha))))
    (local.set $a2 (f32.div (f32.sub (f32.const 1.0) (local.get $alpha)) (f32.add (f32.const 1.0) (local.get $alpha))))
    
    ;; Normalize coefficients
    (local.set $b0 (f32.div (local.get $b0) (f32.add (f32.const 1.0) (local.get $alpha))))
    (local.set $b1 (f32.div (local.get $b1) (f32.add (f32.const 1.0) (local.get $alpha))))
    (local.set $b2 (f32.div (local.get $b2) (f32.add (f32.const 1.0) (local.get $alpha))))
    
    ;; Process each sample
    (local.set $i (i32.const 0))
    (loop $process_loop
      (if (i32.lt_u (local.get $i) (local.get $length))
        (then
          ;; Load input sample
          (local.set $input_sample 
            (f32.load (i32.add (local.get $input_ptr) (i32.mul (local.get $i) (i32.const 4)))))
          
          ;; Apply gain
          (local.set $output_sample (f32.mul (local.get $input_sample) (local.get $gain)))
          
          ;; Apply filter
          (local.set $output_sample 
            (call $biquad_filter (local.get $output_sample) 
                                 (local.get $b0) (local.get $b1) (local.get $b2)
                                 (local.get $a1) (local.get $a2)))
          
          ;; Apply compressor
          (local.set $output_sample 
            (call $compressor (local.get $output_sample) 
                             (local.get $comp_threshold) (local.get $comp_ratio)
                             (f32.const 0.003) (f32.const 0.1)))
          
          ;; Apply delay
          (local.set $output_sample 
            (call $delay (local.get $output_sample) 
                        (local.get $delay_time) (local.get $delay_feedback) (local.get $delay_wet)))
          
          ;; Prevent clipping
          (local.set $output_sample 
            (f32.max (f32.const -1.0) (f32.min (f32.const 1.0) (local.get $output_sample))))
          
          ;; Store output sample
          (f32.store 
            (i32.add (local.get $output_ptr) (i32.mul (local.get $i) (i32.const 4)))
            (local.get $output_sample))
          
          (local.set $i (i32.add (local.get $i) (i32.const 1)))
          (br $process_loop)
        )
      )
    )
  )
  
  ;; Reset all processing state
  (func $reset_state
    (global.set $filter_x1 (f32.const 0.0))
    (global.set $filter_x2 (f32.const 0.0))
    (global.set $filter_y1 (f32.const 0.0))
    (global.set $filter_y2 (f32.const 0.0))
    (global.set $compressor_envelope (f32.const 0.0))
    (global.set $delay_write_index (i32.const 0))
    
    ;; Clear delay buffer
    (local $i i32)
    (local.set $i (i32.const 0))
    (loop $clear_loop
      (if (i32.lt_u (local.get $i) (global.get $delay_buffer_size))
        (then
          (f32.store (i32.mul (local.get $i) (i32.const 4)) (f32.const 0.0))
          (local.set $i (i32.add (local.get $i) (i32.const 1)))
          (br $clear_loop)
        )
      )
    )
  )
  
  ;; Export functions
  (export "process_audio" (func $process_audio))
  (export "process_audio_simd" (func $process_audio_simd))
  (export "reset_state" (func $reset_state))
)
