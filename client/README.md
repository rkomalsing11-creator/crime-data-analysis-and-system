# Crime Reporting and Analysis System

A modern web application for reporting crimes and analyzing trends.

## Features
- **Zero Preloaded Data**: The database starts empty.
- **Custom Crime Types**: Users can manually enter any crime type.
- **Evidence Upload**: Support for image/file uploads with reports.
- **Analysis Dashboard**: Interactive charts showing crime distribution by type and location.
- **Clean Modern UI**: Built with React, Tailwind CSS, and Lucide Icons.

## Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, Recharts, Axios, Lucide React
- **Backend**: Node.js, Express, SQLite3, Multer, CORS
- **Database**: SQLite (No external setup required)

## How to Run

### 1. Prerequisites
- Node.js (v14 or later)
- npm or yarn

### 2. Setup Backend
```bash
cd server
npm install
npm start
```
The backend will run on `http://localhost:5001`.

### 3. Setup Frontend
```bash
cd client
npm install
npm run dev
```
The frontend will run on `http://localhost:3000`.

## Requirements Fulfilled
- No preloaded or default crime data.
- Database starts empty.
- Custom crime type text field.
- Crime Report Form includes Title, Type, Description, Location, Date/Time, and Evidence Upload.
- Reports stored in SQLite database.
- Dashboard and Report List only show user-submitted reports.
- Basic analysis charts included.
