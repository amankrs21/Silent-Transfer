from flask import Flask, render_template, request


app = Flask(__name__)


# Set the upload folder
app.config['UPLOAD_FOLDER'] = 'uploads'

# Maximum allowed file size is 16 MB
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024


# Ensure the upload folder exists
import os
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return 'No file part'
    
    file = request.files['file']
    
    if file.filename == '':
        return 'No selected file'

    if file:
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], file.filename))
        return 'File uploaded successfully'


if __name__ == '__main__':
    app.run(debug=True)
