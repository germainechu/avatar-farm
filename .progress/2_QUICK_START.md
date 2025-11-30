# Quick Start Guide

## 🚀 Running the Application

### Option 1: Development Mode
```bash
npm run dev
```
Then open your browser to the URL shown (typically `http://localhost:3000`)

### Option 2: Production Build
```bash
npm run build
npm run preview
```

## 🎮 Using the Application

### Step 1: Explore Avatars
1. Start on the **Avatar Library** tab
2. Click any avatar card to see detailed information
3. Review their cognitive function stack and communication style

### Step 2: Create a Scenario
1. Click the **Create Scenario** tab
2. Enter a discussion topic (e.g., "Should we prioritize innovation or stability?")
3. Choose an interaction style:
   - **Debate**: Avatars will challenge each other
   - **Brainstorm**: Avatars will generate ideas
   - **Cooperative**: Avatars will seek consensus
4. Select 2-8 avatars to participate
5. Adjust the number of rounds (4-40)
6. Click **Run Simulation**

### Step 3: Watch the Simulation
1. The **Simulation** tab opens automatically
2. Click **▶ Start** to begin
3. Use controls to:
   - **⏸ Pause**: Stop the simulation
   - **▶ Resume**: Continue from pause
   - **⏭ Step**: Advance one message at a time
   - **⟲ Reset**: Start over
4. Watch the **Analytics** panel update in real-time

## 📖 Understanding the Output

### Message Tags
- 👍 **Support**: Avatar agrees or validates
- 🤔 **Critique**: Avatar challenges or analyzes
- 💡 **Idea**: Avatar proposes new possibilities
- 🔍 **Clarify**: Avatar explains details

### Analytics Metrics
- **Messages per Avatar**: Who spoke most/least
- **Message Types**: Distribution of support/critique/idea/clarify
- **Discussion Balance**: Logical ↔ Emotional spectrum

## 🧪 Example Scenarios to Try

### Scenario 1: Decision Making
- **Topic**: "Should we launch the product now or wait for more features?"
- **Style**: Debate
- **Avatars**: INTJ, ENTP, ESFJ, ISTJ
- **Rounds**: 10

### Scenario 2: Creative Brainstorm
- **Topic**: "How can we make remote work more engaging?"
- **Style**: Brainstorm
- **Avatars**: ENFP, INFP, ENTP, INFJ
- **Rounds**: 15

### Scenario 3: Team Planning
- **Topic**: "What should our team priorities be for next quarter?"
- **Style**: Cooperative
- **Avatars**: ENTJ, ISFJ, ESTJ, INFJ, ISTP
- **Rounds**: 20

### Scenario 4: Philosophy Discussion
- **Topic**: "What makes a life well-lived?"
- **Style**: Brainstorm
- **Avatars**: INFP, INTP, ENFJ, INTJ
- **Rounds**: 25

## 🔍 Observing Patterns

### What to Look For

**Ti/Te Types (INTP, INTJ, ENTJ, ENTP, ISTP, ESTJ)**
- More critique and clarify messages
- Logical, systematic language
- Focus on consistency and efficiency

**Fi/Fe Types (INFP, ENFP, INFJ, ENFJ, ISFP, ESFP, ISFJ, ESFJ)**
- More support messages
- Emotionally aware language
- Focus on values and harmony

**Ni/Ne Types (INTJ, INFJ, ENTJ, ENFJ, INTP, INFP, ENTP, ENFP)**
- More idea messages
- Abstract, future-oriented language
- Focus on possibilities and patterns

**Si/Se Types (ISTJ, ISFJ, ESTJ, ESFJ, ISTP, ISFP, ESTP, ESFP)**
- More clarify messages
- Concrete, practical language
- Focus on details and present reality

## 🐛 Troubleshooting

### Dev Server Won't Start
If you see port permission errors:
1. The app is configured to use port 3000
2. Try: `sudo npm run dev` (macOS/Linux)
3. Or edit `vite.config.ts` to use a different port

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Browser Console Errors
- Check that you're using a modern browser (Chrome 90+, Firefox 88+, Safari 14+)
- Clear browser cache and reload
- Check browser console for specific error messages

## 💡 Tips for Best Experience

1. **Start Small**: Try 2-3 avatars for 10 rounds first
2. **Compare Styles**: Run the same scenario with different interaction styles
3. **Mix Temperaments**: Combine NT, NF, SJ, and SP types for diverse perspectives
4. **Watch Analytics**: The balance meter shows if discussion is logical or emotional
5. **Use Step Mode**: Step through messages slowly to read carefully

## 📱 Mobile Usage

The app is responsive and works on mobile devices:
- Avatar cards stack vertically
- Scenario builder adapts to smaller screens
- Simulation view is scrollable
- Analytics panel moves below conversation on mobile

## 🎯 Learning Goals

After using this app, you should understand:
- How cognitive functions influence communication
- Why certain MBTI types approach problems differently
- The difference between surface traits and function-based modeling
- How group composition affects discussion dynamics

## 🤝 Need Help?

- Check the main README.md for detailed documentation
- Review IMPLEMENTATION_SUMMARY.md for technical details
- Inspect the code - it's well-commented!

---

**Enjoy exploring personality dynamics! 🧠✨**
