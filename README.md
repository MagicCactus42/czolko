# Czolko (Who Am I?)

A real-time multiplayer party game where players guess words stuck to their foreheads. Create a room, invite friends, assign words to each other, and take turns asking yes/no questions to figure out who (or what) you are.

## Website Link

https://czolkovercel.vercel.app/

## How to Play

1. **Create a room** - Sign in with Google and create a new game room
2. **Invite friends** - Share the link or 6-character code
3. **Pick seats** - Everyone selects their seat number
4. **Assign words** - Each player assigns a word for someone else to guess
5. **Play** - Take turns asking yes/no questions to guess your word

## Features

- Real-time multiplayer
- Google OAuth for room creators
- Anonymous joining for players
- Three matching modes: Left, Right, Random
- Mobile-responsive design
- Auto-cleanup of expired lobbies (2hr TTL)
- Rate limiting
- Max 32 players per lobby

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Firebase (Firestore + Auth)

## License

MIT
