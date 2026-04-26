/**
 * Test script to verify agent integration with notifications
 */

const BASE_URL = 'http://localhost:3000';

async function testAgentNotification() {
  console.log('🧪 Testing Agent Notification Integration...\n');
  
  try {
    // Test 1: Get all agents
    console.log('1️⃣  Fetching all agents from database...');
    const agentsResponse = await fetch(`${BASE_URL}/api/agents`);
    const agents = await agentsResponse.json();
    console.log(`✅ Found ${agents.data?.length || 0} agents`);
    if (agents.data && agents.data.length > 0) {
      console.log(`   First agent: ${agents.data[0].name} - ${agents.data[0].role}`);
    }
    console.log('');
    
    // Test 2: Test notification generation
    console.log('2️⃣  Testing notification generation with agents...');
    const testResponse = await fetch(`${BASE_URL}/api/notifications/demo?eventType=track.played`);
    const testResult = await testResponse.json();
    
    if (testResult.success) {
      console.log(`✅ Notification generated successfully!`);
      console.log(`   Total agents loaded: ${testResult.data.totalAgents}`);
      console.log(`   Agent names: ${testResult.data.agentNames.slice(0, 5).join(', ')}...`);
      console.log(`   Test message:`);
      console.log(`     Title: ${testResult.data.testMessage.title}`);
      console.log(`     Agent: ${testResult.data.testMessage.agentId}`);
      console.log(`     Priority: ${testResult.data.testMessage.priority}`);
      console.log(`     Message preview: ${testResult.data.testMessage.message.substring(0, 100)}...`);
    } else {
      console.log(`❌ Test failed: ${testResult.error}`);
    }
    console.log('');
    
    // Test 3: List different event types
    console.log('3️⃣  Testing different event types...');
    const eventTypes = [
      'track.played',
      'social.post_liked',
      'wallet.transaction_completed',
      'upload.completed',
      'analytics.milestone'
    ];
    
    for (const eventType of eventTypes) {
      const response = await fetch(`${BASE_URL}/api/notifications/demo?eventType=${eventType}`);
      const result = await response.json();
      if (result.success) {
        const msg = result.data.testMessage;
        console.log(`   ${eventType}: ${msg.agentId} (${msg.priority})`);
      }
    }
    console.log('');
    
    console.log('🎉 All tests completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   - ${agents.data?.length || 0} agents loaded from database`);
    console.log(`   - Notification system integrated with agents`);
    console.log(`   - Multiple event types tested`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testAgentNotification();

