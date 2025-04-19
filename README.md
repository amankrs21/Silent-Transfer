# Silent-Transfer

A minimal Flask-based file upload utility. Useful for receiving files via a simple web interface. Built with configurability and portability in mind.

## Features

- Uploads files via browser to a local `uploads/` directory
- Supports files up to 16MB
- Automatically creates upload folder if it doesn't exist
- Simple and lightweight interface

## Getting Started

### Step 1: Create and Activate Virtual Environment

```bash
python -m venv venv
```

#### On Windows:
```bash
venv\Scripts\activate
```

### Step 2: Install Flask
```bash
pip install flask
```

### Step 3: Set the Flask App
```bash
SET FLASK_APP=app.py
```

### Step 4: Run the Server on Network Mode
```bash
flask run --host="0.0.0.0"
```

Visit the server via your browser at:
```
http://<your-ip>:5000
```

## Project Structure
```
SilentFetch/
├── app.py
├── templates/
│   └── index.html
├── uploads/  # auto-created
└── README.md
```

## Notes
- Max file size: 16MB
- All uploads are saved to the `uploads/` folder
- Use responsibly – intended for personal or internal use

---

> Built for rapid internal transfers or personal tools. Use responsibly.

