# Blog
## A simple project about a blog setup
### Technologies used:
  ___
* Typescript 
* Express
* Prisma ORM
* MySQL
* Joi
* bcrypt
* jsonwebtoken (JWT Bearer)

### Security Notes
* Passwords are hashed with bcrypt (salt rounds: 10) before being stored. Hashing is one-way — the original password cannot be recovered, even by the database owner.
* The password never leaves the database in any response (`select` without `senha` in `POST /users`/`POST /login`, explicit `select` in `GET /posts`).
* `POST /login` uses `bcrypt.compare` and returns the same `401 {"erro":"Erro no login"}` for both "email not found" and "wrong password" to avoid leaking information.
* `POST /login` returns a signed JWT Bearer token (`{ token }`, expires in 1h). Protected routes require `Authorization: Bearer <token>` (checked by `src/middlewares/auth.ts`). The token payload contains the user id, so the server knows who is creating a post.

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
GRANT ALL PRIVILEGES ON bloggers.* TO 'blog_user'@'localhost';
FLUSH PRIVILEGES;
```

The `GRANT ... ON bloggers.*` covers everything this project needs. If you also want to use `npx prisma migrate dev` (which creates a temporary shadow database during development), you'll need the global grant instead: `GRANT ALL PRIVILEGES ON *.* TO 'blog_user'@'localhost';`

> Note: the `FLUSH PRIVILEGES;` is optional since `GRANT` applies immediately in modern MySQL, but it's harmless to keep.

### 2. Configure the environment variables

Copy the example file and fill in your secrets:

```
cp .env.example .env
```

Then edit `.env` and replace `<YOUR_PASSWORD>` and `<YOUR_JWT_SECRET>` (generate a strong secret, e.g. `openssl rand -base64 32`).

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

> Note: if the first request returns a `pool timeout` error right after starting the server, it's the Prisma connection pool warming up — just send the request again.

### Testing the API

Create a user (the password must be 10-20 characters long):

```
curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"nome":"<YOUR_NAME>","email":"<YOUR_EMAIL>","bio":"<YOUR_BIO>","senha":"<YOUR_PASSWORD>"}'
# Example: {"nome":"Maria","email":"maria@example.com","bio":"Learning dev","senha":"senha12345"}
```

> Note: if you run this again, use a different `email` (it must be unique). The password is stored as a bcrypt hash and never returned in any response.

Login (returns `{ token }` on success, 401 with `{"erro":"Erro no login"}` on any failure — email not found or wrong password — without revealing which field is incorrect):

```
curl -X POST http://localhost:3000/login -H "Content-Type: application/json" -d '{"email":"<YOUR_EMAIL>","senha":"<YOUR_PASSWORD>"}'
# -> {"token":"eyJhbGciOiJIUzI1NiIs..."}
```

Create a post (requires Bearer token — the author is taken from the token, not from the body):

```
# For bash/zsh:
TOKEN=$(curl -s -X POST http://localhost:3000/login -H "Content-Type: application/json" -d '{"email":"<YOUR_EMAIL>","senha":"<YOUR_PASSWORD>"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
# For fish:
# set TOKEN (curl -s -X POST http://localhost:3000/login -H "Content-Type: application/json" -d '{"email":"<YOUR_EMAIL>","senha":"<YOUR_PASSWORD>"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

curl -X POST http://localhost:3000/posts -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"titulo":"<YOUR_TITLE>","conteudo":"<YOUR_CONTENT>","categoria":"<YOUR_CATEGORY>"}'
```

List all posts with their authors:

```
curl http://localhost:3000/posts
```
