// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBW5NEYgcBCMwk90aymDs8Lp6ubZXNjaWc",
  authDomain: "sleep-counter-daee2.firebaseapp.com",
  projectId: "sleep-counter-daee2",
  storageBucket: "sleep-counter-daee2.firebasestorage.app",
  messagingSenderId: "508525047618",
  appId: "1:508525047618:web:176096b38764796f3722db",
  measurementId: "G-ESK7QVY1WF"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Set default date
document.getElementById("entryDate").value = new Date().toISOString().split("T")[0];

// Helper
function getSelectedDate(){ return document.getElementById("entryDate").value || new Date().toISOString().split("T")[0]; }

function calculateScore(sleepTime, wakeTime){
  let sleep = new Date("1970-01-01T"+sleepTime);
  let wake = new Date("1970-01-01T"+wakeTime);
  if(wake < sleep) wake.setDate(wake.getDate()+1);

  let hours = (wake-sleep)/3600000;
  let score = 100;
  if(hours<6) score-=30;
  else if(hours<7) score-=10;
  else if(hours>9) score-=10;
  let sleepHour = parseInt(sleepTime.split(":")[0]);
  if(sleepHour>=1) score-=10;
  if(sleepHour>=2) score-=20;
  return Math.max(score,0);
}

// Floating hearts
function createHearts(containerId){
  const container = document.getElementById(containerId);
  const heart = document.createElement("div");
  heart.className = "heart";
  heart.style.left = Math.random()*80 + "%";
  heart.style.fontSize = (12 + Math.random()*12)+"px";
  heart.innerText = "❤️";
  container.appendChild(heart);
  setTimeout(()=> container.removeChild(heart),3000);
}

// Save her sleep
function saveHerSleep(){
  let sleep=document.getElementById("herSleep").value;
  let wake=document.getElementById("herWake").value;
  let date=getSelectedDate();
  let score=calculateScore(sleep,wake);

  db.collection("sleepRecords").doc("her").collection("days").doc(date)
    .set({sleep,wake,score})
    .then(()=> {
      document.getElementById("herScore").innerText="Score: "+score;
      createHearts("heartsHer");
      loadHistory();
    });
}

// Save your sleep
function saveYourSleep(){
  let sleep=document.getElementById("yourSleep").value;
  let wake=document.getElementById("yourWake").value;
  let date=getSelectedDate();
  let score=calculateScore(sleep,wake);

  db.collection("sleepRecords").doc("you").collection("days").doc(date)
    .set({sleep,wake,score})
    .then(()=> {
      document.getElementById("yourScore").innerText="Score: "+score;
      createHearts("heartsYou");
      loadHistory();
    });
}

// Load history and graph
function loadHistory(){
  const herRef=db.collection("sleepRecords").doc("her").collection("days");
  const youRef=db.collection("sleepRecords").doc("you").collection("days");

  Promise.all([herRef.get(),youRef.get()]).then(([herDocs,yourDocs])=>{
    let table=document.querySelector("#historyTable tbody");
    table.innerHTML="";

    let data={};
    herDocs.forEach(d=>{ data[d.id]={...data[d.id],her:d.data().score}; });
    yourDocs.forEach(d=>{ data[d.id]={...data[d.id],you:d.data().score}; });

    let dates=Object.keys(data).sort().reverse();

    dates.forEach(date=>{
      let row=document.createElement("tr");
      row.innerHTML=`<td>${date}</td><td>${data[date].her??"-"}</td><td>${data[date].you??"-"}</td>`;
      table.appendChild(row);
    });

    // Update winner badge for today
    const today = getSelectedDate();
    if(data[today]){
      if(data[today].her > data[today].you) document.getElementById("winnerBadge").innerText="🏆 Her Sleep Wins Today!";
      else if(data[today].her < data[today].you) document.getElementById("winnerBadge").innerText="🏆 Your Sleep Wins Today!";
      else document.getElementById("winnerBadge").innerText="🤝 Equal Sleep Today!";
    }

    // Chart
    const chartLabels=dates.reverse();
    const herScores=chartLabels.map(d=>data[d].her??0);
    const yourScores=chartLabels.map(d=>data[d].you??0);

    if(window.scoreChart) window.scoreChart.destroy();

    const ctx=document.getElementById("scoreChart").getContext("2d");
    window.scoreChart=new Chart(ctx,{
      type:"bar",
      data:{
        labels:chartLabels,
        datasets:[
          {label:"Her Score",data:herScores,backgroundColor:"#ff7a7a"},
          {label:"Your Score",data:yourScores,backgroundColor:"#6a5cff"}
        ]
      },
      options:{
        responsive:true,
        plugins:{legend:{position:"top"}},
        scales:{y:{beginAtZero:true,max:100}}
      }
    });
  });
}

// Event listeners
document.getElementById("herBtn").addEventListener("click",saveHerSleep);
document.getElementById("yourBtn").addEventListener("click",saveYourSleep);

// Initial load
loadHistory();

// Auto create floating stars occasionally
setInterval(()=> createHearts("heartsHer"), 1500);
setInterval(()=> createHearts("heartsYou"), 2000);