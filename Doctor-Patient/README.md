# MediCare Hub - Advanced Healthcare Platform

A comprehensive, modern healthcare platform that connects patients with doctors through an intuitive, AI-powered interface. Built with Node.js, Express, MongoDB, and Socket.IO for real-time communication.

## 🚀 Features

### 🔐 Authentication & Security
- **JWT-based authentication** with secure token management
- **Role-based access control** (Admin, Doctor, Patient)
- **Google OAuth integration** for seamless patient registration
- **Password hashing** with bcrypt for enhanced security
- **Session management** with MongoDB store
- **Rate limiting** and security headers with Helmet

### 👨‍⚕️ Doctor Management
- **Comprehensive doctor registration** with specialization, experience, and qualifications
- **Admin approval system** for doctor verification
- **Doctor profiles** with ratings, reviews, and availability
- **Real-time status tracking** (online/offline)
- **Specialization-based filtering** and search

### 👤 Patient Experience
- **Easy registration** with Google OAuth or traditional signup
- **Comprehensive health tracking** with medical history
- **Symptom assessment** and urgency level selection
- **Smart doctor matching** based on symptoms and specialization
- **Appointment booking** with real-time availability

### 📅 Appointment System
- **Real-time scheduling** with conflict detection
- **Multiple appointment types** (consultation, follow-up, emergency, routine)
- **Status tracking** (scheduled, confirmed, in-progress, completed, cancelled)
- **Video consultation support** with meeting links
- **Appointment reminders** and notifications

### 💊 Prescription Management
- **Digital prescriptions** with secure storage
- **Medication tracking** with dosage and frequency
- **Lab test recommendations** with urgency levels
- **Follow-up scheduling** and reminders
- **Prescription history** for patients

### 🔔 Notification System
- **Real-time notifications** for appointments, prescriptions, and system updates
- **Priority-based notifications** (low, medium, high, urgent)
- **Email and in-app notifications**
- **Notification history** and management

### 💬 Real-time Communication
- **Socket.IO integration** for instant messaging
- **Video call support** for consultations
- **Typing indicators** and message status
- **Appointment-based chat rooms**
- **File sharing** for medical documents

### 📊 Admin Dashboard
- **Comprehensive analytics** with revenue tracking
- **Doctor management** with approval/rejection system
- **Patient oversight** and system monitoring
- **Real-time statistics** and charts
- **System health monitoring**

### 🎨 Modern UI/UX
- **Responsive design** with mobile-first approach
- **Tailwind CSS** for modern styling
- **Interactive charts** with Chart.js
- **Smooth animations** and transitions
- **Accessibility features** and keyboard navigation

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **Socket.IO** - Real-time communication
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **Cloudinary** - Image storage and management
- **Nodemailer** - Email notifications
- **Moment.js** - Date manipulation

### Frontend
- **EJS** - Template engine
- **Tailwind CSS** - Utility-first CSS framework
- **Chart.js** - Data visualization
- **Font Awesome** - Icons
- **Google Fonts** - Typography

### Security & Performance
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Express Rate Limit** - API rate limiting
- **Express Validator** - Input validation
- **Connect Mongo** - Session storage

## 📁 Project Structure

```
Doctor-Patient/
├── models/                 # Database models
│   ├── admin.js           # Admin model
│   ├── doctor.js          # Doctor model with enhanced fields
│   ├── patient.js         # Patient model with medical history
│   ├── appointment.js     # Appointment scheduling
│   ├── prescription.js    # Digital prescriptions
│   └── notification.js    # Notification system
├── routes/                # API routes
│   ├── admin.js          # Admin dashboard routes
│   ├── doctor.js         # Doctor management routes
│   ├── patient.js        # Patient routes
│   ├── auth.js           # Authentication routes
│   ├── appointment.js    # Appointment management
│   ├── prescription.js   # Prescription handling
│   └── notification.js   # Notification system
├── middleware/            # Custom middleware
│   └── auth.js           # Authentication & authorization
├── services/             # Business logic
│   ├── googleAuth.js     # Google OAuth setup
│   ├── uniqueID.js       # ID generation
│   └── socketHandlers.js # Socket.IO handlers
├── views/                # EJS templates
│   ├── index.ejs         # Landing page with modern UI
│   ├── admin.ejs         # Admin dashboard
│   └── patient.ejs       # Patient dashboard
├── public/               # Static assets
│   ├── uploads/          # File uploads
│   └── images/           # Static images
├── index.js              # Main server file
├── package.json          # Dependencies
└── .env                  # Environment variables
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- Cloudinary account (for image storage)
- Google OAuth credentials (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Doctor-Patient
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Database
   MONGO_URI=mongodb://localhost:27017/medicare-hub
   
   # JWT
   JWT_SECRET=your-super-secret-jwt-key
   SESSION_SECRET=your-session-secret-key
   
   # Cloudinary
   CLOUD_NAME=your-cloudinary-cloud-name
   API_KEY=your-cloudinary-api-key
   API_SECRET=your-cloudinary-api-secret
   
   # Google OAuth (optional)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   
   # Server
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Access the application**
   - Open your browser and navigate to `http://localhost:5000`
   - Admin credentials: `admin@medicare.com` / `admin123`

## 📱 Usage

### For Patients
1. **Register** using email/password or Google OAuth
2. **Complete health assessment** with symptoms and medical history
3. **Browse doctors** by specialization and ratings
4. **Book appointments** with preferred doctors
5. **Attend video consultations** or in-person visits
6. **Access digital prescriptions** and medical records
7. **Receive notifications** for appointments and updates

### For Doctors
1. **Register** with professional credentials and ID proof
2. **Wait for admin approval** (automatic notification)
3. **Set availability** and consultation fees
4. **Manage appointments** and patient consultations
5. **Create digital prescriptions** with medication details
6. **Track patient history** and medical records
7. **Receive real-time notifications** for new appointments

### For Admins
1. **Login** with admin credentials
2. **Review doctor applications** and approve/reject
3. **Monitor system analytics** and revenue
4. **Manage user accounts** and system settings
5. **View comprehensive reports** and statistics
6. **Handle system notifications** and alerts

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register/patient` - Patient registration
- `POST /api/auth/register/doctor` - Doctor registration
- `POST /api/auth/login/patient` - Patient login
- `POST /api/auth/login/doctor` - Doctor login
- `POST /api/auth/login/admin` - Admin login
- `GET /api/auth/google` - Google OAuth
- `POST /api/auth/logout` - Logout

### Appointments
- `GET /api/appointments` - Get user appointments
- `POST /api/appointments` - Create appointment
- `PATCH /api/appointments/:id/status` - Update status
- `PATCH /api/appointments/:id/cancel` - Cancel appointment
- `POST /api/appointments/:id/rate` - Rate appointment

### Prescriptions
- `GET /api/prescriptions` - Get prescriptions
- `POST /api/prescriptions` - Create prescription
- `PATCH /api/prescriptions/:id` - Update prescription
- `GET /api/prescriptions/patient/:id/history` - Patient history

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

## 🔒 Security Features

- **JWT Authentication** with secure token management
- **Password hashing** using bcrypt with salt rounds
- **Rate limiting** to prevent abuse
- **Input validation** and sanitization
- **CORS protection** for cross-origin requests
- **Security headers** with Helmet
- **File upload validation** and size limits
- **Session management** with secure cookies

## 📊 Database Schema

### Doctor Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  gender: String,
  specialization: String,
  experience: Number,
  qualification: String,
  consultationFee: Number,
  status: String (pending/approved/rejected/suspended),
  idproof: String (URL),
  doctorid: String (unique),
  availability: Object,
  rating: Number,
  totalReviews: Number,
  bio: String,
  isOnline: Boolean,
  lastActive: Date
}
```

### Patient Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  age: Number,
  gender: String,
  phone: String,
  address: Object,
  emergencyContact: Object,
  medicalHistory: Object,
  verified: String (google/normal),
  googleId: String,
  profilePicture: String,
  isActive: Boolean,
  lastLogin: Date
}
```

### Appointment Model
```javascript
{
  patient: ObjectId,
  doctor: ObjectId,
  appointmentDate: Date,
  appointmentTime: String,
  duration: Number,
  status: String,
  type: String,
  symptoms: [String],
  diagnosis: String,
  notes: String,
  prescription: ObjectId,
  paymentStatus: String,
  amount: Number,
  meetingLink: String,
  isVideoCall: Boolean,
  rating: Number,
  review: String
}
```

## 🚀 Deployment

### Using PM2 (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start index.js --name "medicare-hub"

# Save PM2 configuration
pm2 save
pm2 startup
```

### Using Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Environment Variables for Production
```env
NODE_ENV=production
MONGO_URI=mongodb://your-production-db
JWT_SECRET=your-production-jwt-secret
CLOUD_NAME=your-production-cloudinary
API_KEY=your-production-api-key
API_SECRET=your-production-api-secret
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@medicarehub.com or create an issue in the repository.

## 🔮 Future Enhancements

- [ ] **AI-powered symptom analysis** for better doctor matching
- [ ] **Telemedicine integration** with video calling
- [ ] **Mobile app** development (React Native/Flutter)
- [ ] **Blockchain integration** for secure medical records
- [ ] **IoT device integration** for health monitoring
- [ ] **Machine learning** for predictive health analytics
- [ ] **Multi-language support** for global accessibility
- [ ] **Advanced reporting** and analytics dashboard
- [ ] **Integration with pharmacy** for prescription fulfillment
- [ ] **Insurance claim processing** automation

---

**MediCare Hub** - Revolutionizing healthcare through technology! 🏥✨


