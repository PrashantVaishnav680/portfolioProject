# Portfolio Website

A personal portfolio website built using HTML, CSS, and JavaScript to showcase my skills, projects, and experience in web development and cybersecurity. The website includes a contact form powered by Node.js, Express, and Nodemailer to send emails to both the website owner and the visitor.

## Features

- **About Me:** Introduction, interests, and technical background.
- **Services:** Highlights web development, frontend development, backend development, and cybersecurity.
- **Projects:** Displays projects with category-based filtering.
- **Testimonials:** Shows testimonials in an interactive modal.
- **Responsive Interface:** Includes an interactive sidebar and navigation.
- **Contact Form:** Accepts visitor details and messages.
- **Email Notifications:** Sends contact form submissions to the website owner and a confirmation email to the visitor.

## Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript
- Axios

### Backend
- Node.js
- Express.js
- Nodemailer
- CORS
- dotenv

### Email Service
- Gmail SMTP

## Project Structure

```text
portfolioProject/
├── assets/
│   └── images/
├── index.html
├── style.css
├── script.js
├── server.js
├── package.json
├── package-lock.json
├── .env
├── .gitignore
└── README.md
```

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/portfolioProject.git
cd portfolioProject
```

Replace `YOUR_USERNAME` with your GitHub username.

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
```

Use a Gmail App Password if your Nodemailer configuration uses Gmail SMTP. Do not use your regular Gmail password.

**Important:** Never upload your `.env` file to GitHub or expose email credentials in frontend JavaScript.

### 4. Start the Backend Server

```bash
npm start
```

The backend will run on:

```text
http://localhost:3000
```

Ensure that `package.json` contains the following start script:

```json
"scripts": {
  "start": "node server.js"
}
```

### 5. Run the Frontend

Open `index.html` using a local development server, such as the Live Server extension in Visual Studio Code.

Make sure the frontend Axios request points to the correct backend endpoint:

```text
http://localhost:3000/api/contact-form
```

## Contact Form Workflow

1. A visitor fills in the contact form.
2. JavaScript validates the form and sends the data to the Express API.
3. The backend validates the submitted fields.
4. Nodemailer sends an email containing the visitor's message to the website owner.
5. Nodemailer sends a confirmation email to the visitor.

### API Endpoint

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/contact-form` | Submit contact form details and send emails |

Expected request fields:

- `name`
- `email`
- `subject`
- `message`

## Deployment

The website can be deployed using separate hosting services for the frontend and backend.

- **Frontend:** Vercel or another static hosting platform.
- **Backend:** Render or another Node.js-compatible hosting platform.

Before deploying:

1. Configure the backend to use `process.env.PORT`.
2. Add `EMAIL_USER` and `EMAIL_PASS` to the backend hosting provider's environment variables.
3. Update the frontend API URL to the deployed backend URL.
4. Configure CORS to allow requests from the deployed frontend domain.
5. Test both contact form emails after deployment.

## Security Considerations

- Store email credentials in environment variables.
- Exclude `.env` and `node_modules/` from Git.
- Validate and sanitize contact form input on the backend.
- Restrict CORS to trusted frontend origins in production.
- Configure rate limiting to reduce contact form abuse.

## Future Improvements

- Add stronger backend input validation.
- Implement rate limiting and spam protection.
- Improve form submission feedback and error handling.
- Add more projects with live demos and source code links.
- Enhance accessibility and responsive design.
- Add a custom domain and production deployment.

## Author

**Prashant Vaishnav**

- GitHub: [PrashantVaishnav680](https://github.com/PrashantVaishnav680)
- GeeksforGeeks: [prashant01](https://www.geeksforgeeks.org/profile/prashant01)
- Instagram: [@prashant01_11](https://www.instagram.com/prashant01_11/)

---

Built with HTML, CSS, JavaScript, and Node.js.
