# Blog
## A simple project about a blog setup
### Technologies used:
  ___
* Typescript
* Express
* Prisma ORM
* MySql
* Joi

## Getting Started

### Prerequisites
  ___
* Node.js 22.x (tested with 22.22.3)
* MySQL 8.x or MariaDB 10.x/11.x running on port 3306

### 1. Set up the database

Connect to MySQL as root:

```
mysql -u root -p
```

Then run:

```sql
CREATE DATABASE bloggers;
CREATE USER 'blog_user'@'localhost' IDENTIFIED BY '<YOUR_PASSWORD>';
GRANT ALL PRIVILEGES ON *.* TO 'blog_user'@'localhost';
FLUSH PRIVILEGES;
```

The global `GRANT ALL PRIVILEGES ON *.*` is needed so Prisma Migrate can create a temporary shadow database during development. For local/learning setups this is fine.

### 2. Configure the environment variables

Copy the example file and fill in your database password:

```
cp .env.example .env
```

### 3. Install dependencies and set up the database

```
npm install
npx prisma generate
npx prisma migrate deploy
```

### 4. Run the server

```
npm run dev
```

The API will be available at http://localhost:3000

### Testing the API

Create a user (the password must be 10-20 characters long):

```
curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"nome":"Maria","email":"maria@teste.com","bio":"Dev em aprendizado","senha":"senha12345"}'
```

Create a post (use the `id` returned by the previous request as `usuarioId`):

```
curl -X POST http://localhost:3000/posts -H "Content-Type: application/json" -d '{"titulo":"My first post","conteudo":"Content of a test post","categoria":"Tecnology","usuarioId":1}'
```

List all posts with their authors:

```
curl http://localhost:3000/posts
```
