# AI-Powered Symptom Analyzer & Doctor Recommendation System - Setup Guide

## Overview
This is a comprehensive AI-powered healthcare platform that connects patients with doctors based on intelligent symptom analysis. The system uses advanced algorithms to analyze patient symptoms and recommend the most suitable doctors.

## Features

### 🤖 AI-Powered Features
- **Intelligent Symptom Analysis**: Analyzes patient symptoms and determines urgency levels
- **Smart Doctor Matching**: Matches patients with appropriate doctors based on specialization
- **Automated Recommendations**: Provides AI-generated health recommendations and action plans
- **Symptom Autocomplete**: Real-time symptom suggestions for better data entry

### 👥 User Features
- **Patient Dashboard**: Complete health assessment and doctor search
- **Doctor Dashboard**: Manage appointments and prescriptions
- **Admin Dashboard**: Comprehensive system management and analytics

### 📊 System Features
- **Real-time Notifications**: Socket.IO powered notifications
- **Digital Prescriptions**: Secure digital prescription management
- **Appointment Management**: Full appointment lifecycle management
- **Multi-role Support**: Patient, Doctor, and Admin roles

## Technology Stack
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Frontend**: EJS Templates with Tailwind CSS
- **Real-time**: Socket.IO
- **Authentication**: JWT with bcrypt
- **File Upload**: Multer for handling file uploads

## Prerequisites
1. Node.js (v16 or higher)
2. MongoDB (v5 or higher, running locally)
3. Git

## Installation Steps

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Doctor-Patient
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory with the following content:

```env
# Database Configuration
MONGO_URI=mongodb://localhost:27017/medicare-hub

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SESSION_SECRET=your-session-secret-key-change-this-in-production

# Cloudinary Configuration (Optional - for image uploads)
CLOUD_NAME=your-cloudinary-cloud-name
API_KEY=your-cloudinary-api-key
API_SECRET=your-cloudinary-api-secret

# Google OAuth Configuration (Optional)
CLIENT_ID=your-google-client-id
CLIENT_SECRET=your-google-client-secret
CALL_BACK_URL=http://localhost:5000/api/auth/google/callback

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5000

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Admin Default Credentials
ADMIN_EMAIL=admin@medicare.com
ADMIN_PASSWORD=admin123
```

### 4. Create Required Directories
```bash
mkdir -p public/uploads
```

### 5. Start MongoDB
Make sure MongoDB is running on your system:

**Windows:**
```bash
# If MongoDB is installed as a service, it should start automatically
# Or start it manually:
"C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe"
```

**Linux/Mac:**
```bash
mongod
```

### 6. Start the Application

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

### 7. Access the Application
- Open your browser and navigate to `http://localhost:5000`
- Use the login credentials provided in the `.env` file for admin access

## Usage Guide

### For Patients
1. **Register**: Sign up as a patient or use Google OAuth
2. **Health Assessment**: Enter your symptoms
3. **AI Analysis**: Get AI-powered symptom analysis and recommendations
4. **Doctor Selection**: Browse and select from recommended doctors
5. **Book Appointment**: Schedule appointments with your chosen doctor
6. **Manage**: View appointments, prescriptions, and medical history

### For Doctors
1. **Register**: Create an account with medical credentials
2. **Wait for Approval**: Admin will approve your account
3. **Dashboard**: Access your dashboard with patient appointments
4. **Consultations**: Manage patient consultations
5. **Prescriptions**: Create and manage digital prescriptions
6. **Availability**: Set and update your availability

### For Admins
1. **Login**: Use admin credentials to login
2. **Dashboard**: View system analytics and statistics
3. **Doctor Management**: Approve/reject doctor registrations
4. **Monitoring**: Track appointments, patients, and system health
5. **Reports**: Generate comprehensive system reports

## API Endpoints

### Authentication
- `POST /api/auth/register/patient` - Patient registration
- `POST /api/auth/register/doctor` - Doctor registration
- `POST /api/auth/login/patient` - Patient login
- `POST /api/auth/login/doctor` - Doctor login
- `POST /api/auth/login/admin` - Admin login
- `GET /api/auth/google` - Google OAuth
- `POST /api/auth/logout` - Logout

### AI Symptom Analysis
- `POST /patientPage/analyze-symptoms` - Analyze symptoms and get recommendations
- `GET /patientPage/symptom-suggestions?query=...` - Get symptom suggestions
- `GET /patientPage/symptoms` - Get all available symptoms
- `POST /patientPage/create-ai-appointment` - Create appointment with AI recommendation

### Appointments
- `GET /api/appointments` - Get appointments
- `POST /api/appointments` - Create appointment
- `PATCH /api/appointments/:id/status` - Update appointment status
- `PATCH /api/appointments/:id/cancel` - Cancel appointment
- `POST /api/appointments/:id/rate` - Rate appointment

### Prescriptions
- `GET /api/prescriptions` - Get prescriptions
- `POST /api/prescriptions` - Create prescription
- `GET /api/prescriptions/:id` - Get prescription by ID
- `PATCH /api/prescriptions/:id` - Update prescription

### Notifications
- `GET /api/notifications` - Get notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### Admin
- `GET /adminPage` - Admin dashboard
- `POST /adminPage/approve-doctor/:id` - Approve doctor
- `POST /adminPage/reject-doctor/:id` - Reject doctor
- `GET /adminPage/doctors` - Get all doctors
- `GET /adminPage/analytics` - System analytics

## AI Symptom Analyzer

The AI symptom analyzer uses intelligent algorithms to:
1. **Analyze Symptoms**: Processes input symptoms to determine medical categories
2. **Determine Urgency**: Categorizes urgency levels (low, medium, high, urgent, emergency)
3. **Recommend Specialists**: Matches symptoms with appropriate medical specializations
4. **Generate Action Plans**: Provides personalized health recommendations
5. **Calculate Confidence**: Scores recommendations based on symptom matching

### Supported Specializations
- Cardiology
- Dermatology
- Neurology
- Orthopedics
- Pediatrics
- Psychiatry
- General Medicine
- Gynecology
- Ophthalmology
- ENT (Ear, Nose, Throat)

## Troubleshooting

### Database Connection Issues
- Ensure MongoDB is running
- Check `MONGO_URI` in `.env` file
- Verify database connection string format

### Port Already in Use
- Change `PORT` in `.env` file
- Or stop the process using the port

### Module Not Found Errors
- Run `npm install` again
- Clear `node_modules` and reinstall
- Check Node.js version compatibility

### Image Upload Issues
- Ensure `public/uploads` directory exists
- Check file permissions
- Configure Cloudinary if using cloud storage

## Development

### File Structure
```
Doctor-Patient/
├── models/              # Database models
├── routes/              # API routes
├── middleware/          # Authentication & authorization
├── services/            # Business logic (AI analyzer, etc.)
├── views/               # EJS templates
├── public/              # Static files
└── index.js             # Main server file
```

### Adding New Features
1. Create model in `models/`
2. Add routes in `routes/`
3. Update views in `views/`
4. Test thoroughly before deployment

## Production Deployment

### Environment Variables
- Set `NODE_ENV=production`
- Use strong JWT secrets
- Configure secure MongoDB connection
- Set up Cloudinary for image storage
- Configure proper CORS settings

### Security Checklist
- [ ] Strong JWT secrets
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Password hashing implemented
- [ ] SQL injection prevention (if applicable)

## Support

For issues or questions:
- Check the troubleshooting section
- Review the code comments
- Contact the development team

## License

This project is licensed under the MIT License.

