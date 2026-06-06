<script>
async function updateBars() {
  const res = await fetch("eventos.json?v="); // tu archivo en GitHub
  const events = await res.json();
  const now = new Date();

  events.forEach(ev => {
    const start = new Date(ev.start);
    const elapsed = Math.floor((now - start) / 60000); // minutos transcurridos
    const bar = document.getElementById("bar-" + ev.id);
    const extra = document.getElementById("extra-" + ev.id);

    if (!bar || !extra) return;

    if (elapsed >= 0 && elapsed <= ev.duration) {
      const percent = (elapsed / ev.duration) * 100;
      bar.style.width = percent + "%";
      extra.textContent = elapsed + "'";
    } else if (elapsed > ev.duration) {
      bar.style.width = "100%";
      extra.textContent = "Finalizado" + (ev.extra ? " +" + ev.extra : "");
    } else {
      bar.style.width = "0%";
      extra.textContent = "Próximamente";
    }
  });
}

setInterval(updateBars, 60000); // cada minuto
updateBars();
</script>
