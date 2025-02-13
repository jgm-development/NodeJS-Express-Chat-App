var joinBtn = document.querySelector("#loginForm");
if (joinBtn) {
    joinBtn.addEventListener("submit", function(event) {
        event.preventDefault();
        let username = document.getElementById("username").value;
        let room = document.getElementById("selRoom").value;
        if (username && room) {
            window.location.href = `/main?username=${encodeURIComponent(username)}&room=${encodeURIComponent(room)}`;
        }
    });
}
