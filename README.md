# Aqua Home

## Project Overview
Aqua Home is a smart home management system aimed at simplifying household operations through automation and monitoring. This application connects multiple devices in your home, allowing you to manage them from a single interface.

## Features
- Real-time device monitoring
- Automated scheduling for devices
- User-friendly interface
- Compatibility with multiple device types

## Tech Stack
- **Frontend:** React, Redux
- **Backend:** Node.js, Express
- **Database:** MongoDB
- **Cloud:** AWS

## Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/madanvaidya007/aquahome.git
   cd aquahome
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your environment file:
   - Copy `.env.example` to `.env`
   - Fill in the required values

## Environment Variables
```ini
DATABASE_URL=mongodb://<username>:<password>@localhost:27017/aquahome
JWT_SECRET=<your_jwt_secret>
AWS_ACCESS_KEY=<your_aws_access_key>
AWS_SECRET_KEY=<your_aws_secret_key>
```

## Run / Dev / Build
- Run: `npm run start`
- Dev: `npm run dev`
- Build: `npm run build`

## Folder Structure
```text
/aquahome
|-- /client       # Frontend code
|-- /server       # Backend code
|-- /config       # Configuration files
|-- /scripts      # Utility scripts
|-- .env.example  # Example environment variables
|-- package.json  # Project metadata and dependencies
```

## Contributing
1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m "Add feature"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

## License
MIT — see [LICENSE](LICENSE).
