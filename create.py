import os
from flask import Flask
from models import *

app = Flask(__name__)
# Configure database
app.config['SQLALCHEMY_DATABASE_URI']=os.environ.get('POSTGRES_URI')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS']=False

db.init_app(app)

def main():
    db.create_all()

if __name__ == "__main__":
    with app.app_context():
        main()
