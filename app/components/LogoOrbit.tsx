import { motion } from 'framer-motion';
export function LogoOrbit({ size=56 }) {
  return (
    <div className="relative inline-grid place-items-center" style={{ width:size, height:size }}>
      <motion.img src="/brand/vx9.svg" alt="VX9" className="rounded-full"
        initial={{ rotate:0, opacity:0.9 }} animate={{ rotate:360, opacity:1 }}
        transition={{ repeat:Infinity, duration:16, ease:"linear" }} />
      <motion.div className="absolute inset-0 rounded-full ring-2 ring-teal-500/30 blur-[1px]"
        initial={{ scale:0.9 }} animate={{ scale:[0.9,1.05,0.9] }}
        transition={{ repeat:Infinity, duration:4 }} />
    </div>
  );
}
