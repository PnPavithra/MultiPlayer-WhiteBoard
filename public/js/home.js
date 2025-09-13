function generateRoomId()
{
    return Math.random().toString(36).substr(2, 6);
}

const createBtn = document.getElementById("createRoomBtn");
const joinRoomBtn = document.getElementById("joinRoomBtn");
const roomLink = document.getElementById("roomLink");
const generatedLink = document.getElementById("generatedLink");

createBtn.addEventListener("click", () => 
{
    const roomId = generateRoomId();
    const link = `${window.location.origin}/room/${roomId}`;
    generatedLink.textContent = link;
    roomLink.style.display = "block";

    navigator.clipboard.writeText(link).then(() =>
    {
        alert("Link copied!");
    });

    window.location.href = link;
});

joinRoomBtn.addEventListener("click", () =>
{
    const input = document.getElementById("joinRoomInput").value.trim();

    if(!input) return;
    let roomId;

    if(input.includes("/room/"))
    {
        roomId = input.split("/room/")[1];
    }

    else
    {
        roomId = input;
    }

    window.location.href = `/room/${roomId}`;
});