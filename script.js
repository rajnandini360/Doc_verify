// 📸 IMAGE PREVIEW
document.getElementById("fileInput").addEventListener("change", function (e) {
  const file = e.target.files[0];
  const preview = document.getElementById("preview");

  if (file) {
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
  }
});


// 👤 GET USER NAME
async function getUser() {
  try {
    const res = await fetch("/auth/user", {
      credentials: "include"
    });

    const user = await res.json();

    if (!user) {
      window.location.href = "/";
      return;
    }

    document.querySelector(".welcome").innerText =
      "Welcome " + user.displayName;

  } catch (err) {
    console.error(err);
  }
}


// 🚀 UPLOAD
async function upload(type) {
  const file = document.getElementById("fileInput").files[0];

  if (!file) {
    alert("Select file first");
    return;
  }

  const form = new FormData();
  form.append("file", file);

  document.getElementById("result").innerText = "Processing...";

  const res = await fetch(`/api/${type}`, {
    method: "POST",
    body: form,
    credentials: "include"
  });

  const data = await res.json();

  document.getElementById("result").innerText =
    data.status || "Done";

  loadDocs();
}


// 📂 LOAD HISTORY
async function loadDocs() {
  const res = await fetch("/api/documents", {
    credentials: "include"
  });

  const data = await res.json();
  const table = document.getElementById("docTable");

  table.innerHTML = data.map(doc => {

    const dateTime = doc.createdAt
      ? new Date(doc.createdAt).toLocaleString()
      : "N/A";

    return `
      <tr>
        <td>${doc.status}</td>

        <td>
          <img src="http://localhost:5000/${doc.imagePath}"
               width="80" />
        </td>

        <td>${dateTime}</td>
      </tr>
    `;

  }).join("");
}
function logout() {
  window.location.href = "/auth/logout";
}

// OPEN / CLOSE
function toggleChat() {
  const chat = document.getElementById("chatbot");
  chat.style.display = chat.style.display === "flex" ? "none" : "flex";
}

// SEND MESSAGE (calls backend)
async function sendMessage() {
  const input = document.getElementById("chatInput");
  const msg = input.value.trim();
  if (!msg) return;

  addMessage("You", msg);
  input.value = "";

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: msg })
    });

    const data = await res.json();

    addMessage("Bot", data.reply);

  } catch (err) {
    addMessage("Bot", "Server error ❌");
  }
}

// ADD MESSAGE UI
function addMessage(type, text) {
  const box = document.getElementById("chat-messages");

  const div = document.createElement("div");
  div.className = "msg " + type;

  div.innerHTML = `<b>${type === "user" ? "You" : "Bot"}:</b> ${text}`;

  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

// 🚀 INITIAL LOAD
getUser();
loadDocs();