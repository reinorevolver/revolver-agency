/* Revolver Agency — floating AI chat widget */
(function () {
  var lang = (document.documentElement.lang === "en") ? "en" : "ka";
  var T = {
    ka: { title: "Revolver AI", sub: "გკითხე ნებისმიერი რამ", ph: "დაწერე შეტყობინება...", hi: "გამარჯობა! 👋 მე ხელოვნური ინტელექტი ვარ და ქართულად შესაძლოა ყველაფერი სრულყოფილად ვერ ჩამოვაყალიბო — წინასწარ ბოდიში. დაგეხმარები სერვისებში, პაკეტებსა და ფასებში. უფრო დეტალური ინფორმაციისთვის კი დარეკეთ: +995 555 451 003", err: "ბოდიში, შეცდომა მოხდა. სცადე ხელახლა ან მოგვწერე: aim@revolver.ge", send: "გაგზავნა" },
    en: { title: "Revolver AI", sub: "Ask me anything", ph: "Type a message...", hi: "Hi! 👋 I am an AI assistant and my Georgian may not be perfect — apologies in advance. I can help with services, packages and pricing. For more detailed information, call us: +995 555 451 003", err: "Sorry, something went wrong. Try again or email aim@revolver.ge", send: "Send" }
  };
  var t = T[lang];
  var history = [];

  var btn = document.createElement("button");
  btn.className = "rv-chat-btn";
  btn.setAttribute("aria-label", "Chat");
  btn.innerHTML = "<img src=\"assets/revolver-mark.png\" alt=\"\"><span class=\"rv-chat-dot\"></span>";

  var panel = document.createElement("div");
  panel.className = "rv-chat-panel";
  panel.innerHTML =
    "<div class=\"rv-chat-head\">" +
      "<img src=\"assets/revolver-mark.png\" alt=\"\">" +
      "<div><div class=\"rv-chat-title\">" + t.title + "</div><div class=\"rv-chat-sub\">" + t.sub + "</div></div>" +
      "<button class=\"rv-chat-close\" aria-label=\"Close\">&times;</button>" +
    "</div>" +
    "<div class=\"rv-chat-body\"></div>" +
    "<form class=\"rv-chat-form\"><input type=\"text\" placeholder=\"" + t.ph + "\" autocomplete=\"off\"><button type=\"submit\" aria-label=\"" + t.send + "\">&#10148;</button></form>";

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  var body = panel.querySelector(".rv-chat-body");
  var form = panel.querySelector(".rv-chat-form");
  var input = panel.querySelector("input");
  var greeted = false;

  function add(role, text) {
    var row = document.createElement("div");
    row.className = "rv-msg rv-" + role;
    row.textContent = text;
    body.appendChild(row);
    body.scrollTop = body.scrollHeight;
    return row;
  }
  function typing() {
    var row = document.createElement("div");
    row.className = "rv-msg rv-assistant rv-typing";
    row.innerHTML = "<span></span><span></span><span></span>";
    body.appendChild(row);
    body.scrollTop = body.scrollHeight;
    return row;
  }

  function open() {
    panel.classList.add("open");
    btn.classList.add("hide");
    if (!greeted) { add("assistant", t.hi); greeted = true; }
    setTimeout(function () { input.focus(); }, 200);
  }
  function close() { panel.classList.remove("open"); btn.classList.remove("hide"); }

  btn.addEventListener("click", open);
  panel.querySelector(".rv-chat-close").addEventListener("click", close);

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text) return;
    input.value = "";
    add("user", text);
    history.push({ role: "user", content: text });
    var tp = typing();
    fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: history, lang: lang })
    }).then(function (r) { return r.json(); }).then(function (d) {
      tp.remove();
      var reply = (d && d.reply) ? d.reply : t.err;
      add("assistant", reply);
      history.push({ role: "assistant", content: reply });
    }).catch(function () {
      tp.remove();
      add("assistant", t.err);
    });
  });
})();

