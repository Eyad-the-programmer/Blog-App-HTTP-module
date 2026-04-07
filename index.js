import http from "http";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fileData = path.join(__dirname, "users.json");



async function getUsers() {
  try {
    const data = await fs.readFile(fileData, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveUsers(users) {
  try {
    await fs.writeFile(fileData, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error("Error saving users:", error);
  }
}

function getBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}



const server = http.createServer(async (req, res) => {
  // POST /user — Add new user
  if (req.url === "/user" && req.method === "POST") {
    const { name, email, age } = await getBody(req);

    if (!name || !email || !age) {
      res.writeHead(400, { "content-type": "application/json" });
      return res.end(JSON.stringify({ message: "Missing data." }));
    }

    const users = await getUsers();
    const userExists = users.find((user) => user.email === email);

    if (userExists) {
      res.writeHead(409, { "content-type": "application/json" });
      return res.end(JSON.stringify({ message: "Email already exists." }));
    }

    const newUser = {
      id: Date.now(),
      name,
      email,
      age,
    };

    users.push(newUser);
    await saveUsers(users);

    res.writeHead(201, { "content-type": "application/json" });
    return res.end(JSON.stringify({ message: "User added successfully." }));
  }

  // PATCH /user/:id — Update user by ID
  else if (req.url.startsWith("/user/") && req.method === "PATCH") {
    const id = Number(req.url.split("/")[2]);
    const { name, email, age } = await getBody(req);

    const users = await getUsers();
    const userIndex = users.findIndex((user) => user.id === id);

    if (userIndex === -1) {
      res.writeHead(404, { "content-type": "application/json" });
      return res.end(JSON.stringify({ message: "User ID not found." }));
    }

    if (name)  users[userIndex].name  = name;
    if (email) users[userIndex].email = email;
    if (age)   users[userIndex].age   = age;

    await saveUsers(users);

    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ message: "User updated successfully." }));
  }

  // DELETE /user/:id — Delete user by ID
  else if (req.url.startsWith("/user/") && req.method === "DELETE") {
    const id = Number(req.url.split("/")[2]);

    const users = await getUsers();
    const userIndex = users.findIndex((user) => user.id === id);

    if (userIndex === -1) {
      res.writeHead(404, { "content-type": "application/json" });
      return res.end(JSON.stringify({ message: "User ID not found." }));
    }

    users.splice(userIndex, 1);
    await saveUsers(users);

    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ message: "User deleted successfully." }));
  }

  // GET /user — Get all users
  else if (req.url === "/user" && req.method === "GET") {
    const users = await getUsers();

    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify(users));
  }

  // GET /user/:id — Get user by ID
  else if (req.url.startsWith("/user/") && req.method === "GET") {
    const id = Number(req.url.split("/")[2]);

    const users = await getUsers();
    const user = users.find((user) => user.id === id);

    if (!user) {
      res.writeHead(404, { "content-type": "application/json" });
      return res.end(JSON.stringify({ message: "User not found." }));
    }

    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify(user));
  }

  // 404 fallback
  else {
    res.writeHead(404, { "content-type": "application/json" });
    return res.end(JSON.stringify({ message: "Route not found." }));
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at ${PORT}`);
});