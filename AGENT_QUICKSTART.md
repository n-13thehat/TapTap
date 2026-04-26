# 🤖 TapTap AI Agents - Quick Start Guide

## 🎉 What's New

All **18 AI agents** are now integrated into TapTap Matrix with:
- ✅ Database-driven agent system
- ✅ Personalized notifications
- ✅ Interactive chat interface
- ✅ Full Docker setup

---

## 🚀 Quick Start (3 Steps)

### 1. Start the Application
```bash
docker-compose up -d
```

### 2. Access Agent Chat
Open your browser to:
```
http://localhost:3000/agents/chat
```

### 3. Chat with Agents!
- Select any of the 18 agents from the sidebar
- Type a message and press Enter
- Watch the agent respond with their unique personality!

---

## 🤖 Meet the Agents

| Agent | Role | Specialty |
|-------|------|-----------|
| 🟣 **Muse** | Creator Whisperer | Inspiration & storytelling |
| 💧 **Hope** | Listener Companion | Music recommendations |
| 💰 **Treasure** | Economy Keeper | Wallet & rewards |
| 🎶 **Harmony** | Playlist Architect | Music curation |
| 🔁 **Echo** | Social Reactor | Engagement & community |
| ✨ **Aura** | Brand Spirit | Design & aesthetics |
| 🏅 **Merit** | Reward Judge | Loyalty & perks |
| 🌤️ **Bliss** | Community Healer | Support & wellness |
| 🛡️ **Haven** | Guardian | Safety & security |
| 🔎 **Prism** | Analytics Oracle | Data & insights |
| 💥 **Nova** | Creative Burst | Viral content |
| ⚙️ **Rune** | Automation Architect | Workflows & automation |
| 📜 **Fable** | Story Weaver | Long-form content |
| 🏁 **Saga** | Campaign Conductor | Strategy & planning |
| 💌 **Charm** | Influencer Connector | Partnerships |
| 🎬 **Lumen** | Video Editor | Video production |
| 💎 **Fortune** | Revenue Strategist | Monetization |
| 💙 **Serenity** | Timekeeper | Scheduling & pacing |

---

## 📍 Key URLs

- **Agent Chat:** http://localhost:3000/agents/chat
- **API Docs:** http://localhost:3000/api/agents
- **Notifications:** http://localhost:3000/api/notifications

---

## 🛠️ Common Commands

```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f app

# Restart app
docker-compose restart app

# Stop everything
docker-compose down

# Check database
docker exec taptap-postgres psql -U postgres -d taptap_dev -c "SELECT name, role FROM \"Agent\";"
```

---

## 💡 Try These Messages

Chat with different agents and try:

**With Muse (Creator):**
- "Help me write a bio"
- "I need inspiration"
- "Tell me about storytelling"

**With Harmony (Music):**
- "Create a playlist for studying"
- "What's good for a workout?"
- "Help me discover new music"

**With Treasure (Economy):**
- "How do I earn TapCoin?"
- "Explain rewards"
- "Help with my wallet"

**With Echo (Social):**
- "How can I boost engagement?"
- "Help me with comments"
- "Grow my audience"

**With Prism (Analytics):**
- "Show me my stats"
- "What are my insights?"
- "Help me understand the data"

---

## 📚 Full Documentation

- **Complete Guide:** `docs/AGENT_INTEGRATION_SUMMARY.md`
- **Docker Setup:** `docs/DOCKER_SETUP.md`
- **Database Guide:** `docs/DATABASE_SETUP_GUIDE.md`

---

## 🎯 What's Working

✅ All 18 agents loaded from database  
✅ Agent chat UI fully functional  
✅ Personality-based responses  
✅ Notification system integrated  
✅ Docker environment running  
✅ API endpoints operational  

---

## 🔧 Troubleshooting

**Agents not showing?**
```bash
docker-compose restart app
```

**Chat not responding?**
- Check you're logged in
- Check browser console for errors
- Verify API is running: `docker logs taptap-app`

**Database issues?**
```bash
docker-compose down -v
docker-compose up -d
```

---

## 🚀 Next Steps

1. **Try all 18 agents** - Each has unique personality!
2. **Test notifications** - Agents send personalized messages
3. **Explore the API** - Build custom integrations
4. **Add AI/LLM** - Replace templates with real AI

---

## 📞 Support

- Check logs: `docker-compose logs -f`
- View tasks: See `docs/AGENT_INTEGRATION_SUMMARY.md`
- Database help: See `docs/DATABASE_SETUP_GUIDE.md`

---

**Built with ❤️ by the TapTap Team**  
**Powered by 18 AI Agents 🤖**

