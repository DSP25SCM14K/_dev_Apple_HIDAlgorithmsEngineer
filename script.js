const phrases = [
  "turning noisy sensor traces into stable HID-style events",
  "validating C/C++ integration at the hardware/software boundary",
  "measuring false positives, missed touches, latency, and jitter",
  "using robotic actuator scenarios to compare algorithm versions",
  "linking oscilloscope traces to event-delivery behavior",
  "compounding engineering speed with AI-generated tests and analysis"
];

const rotatingSignal = document.getElementById("rotating-signal");
let phraseIndex = 0;

setInterval(() => {
  if (!rotatingSignal) return;
  phraseIndex = (phraseIndex + 1) % phrases.length;
  const outAnimation = rotatingSignal.animate(
    [
      { opacity: 1, transform: "translateY(0)" },
      { opacity: 0, transform: "translateY(-6px)" }
    ],
    { duration: 180, easing: "ease-out" }
  );
  outAnimation.onfinish = () => {
    rotatingSignal.textContent = phrases[phraseIndex];
    rotatingSignal.animate(
      [
        { opacity: 0, transform: "translateY(6px)" },
        { opacity: 1, transform: "translateY(0)" }
      ],
      { duration: 240, easing: "ease-out" }
    );
  };
}, 2600);

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16, rootMargin: "0px 0px -40px 0px" }
);

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

const metricObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const target = entry.target;
      const endValue = Number(target.dataset.count || 0);
      const suffix = target.dataset.suffix || "";
      const startTime = performance.now();
      const duration = 1300;

      const update = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const raw = eased * endValue;
        const value = Number.isInteger(endValue) ? Math.round(raw) : raw.toFixed(2);
        target.textContent = `${value}${suffix}`;
        if (progress < 1) requestAnimationFrame(update);
      };

      requestAnimationFrame(update);
      metricObserver.unobserve(target);
    });
  },
  { threshold: 0.7 }
);

document.querySelectorAll("[data-count]").forEach((metric) => metricObserver.observe(metric));

document.querySelectorAll("[data-tilt-card]").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(1200px) rotateX(${y * -5}deg) rotateY(${x * 6}deg)`;
  });

  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
});

document.querySelectorAll(".filter-button").forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    document.querySelectorAll(".filter-button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    document.querySelectorAll(".project-card").forEach((card) => {
      const categories = card.dataset.category || "";
      card.hidden = !(filter === "all" || categories.split(" ").includes(filter));
    });
  });
});

const canvas = document.getElementById("signal-canvas");
const context = canvas.getContext("2d");
const traces = [];
const packets = [];
let width = 0;
let height = 0;
let deviceRatio = Math.min(window.devicePixelRatio || 1, 2);

function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;
  deviceRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(width * deviceRatio);
  canvas.height = Math.floor(height * deviceRatio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(deviceRatio, 0, 0, deviceRatio, 0, 0);
}

function seed() {
  traces.length = 0;
  packets.length = 0;
  const traceCount = Math.max(8, Math.min(16, Math.floor(width / 110)));
  for (let index = 0; index < traceCount; index += 1) {
    traces.push({
      y: height * (0.16 + index * 0.047),
      amp: 8 + Math.random() * 24,
      speed: 0.001 + Math.random() * 0.0018,
      hue: [190, 154, 42, 5][index % 4],
      phase: Math.random() * Math.PI * 2
    });
  }

  const packetCount = Math.min(86, Math.max(44, Math.floor(width / 18)));
  for (let index = 0; index < packetCount; index += 1) {
    packets.push({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: 0.25 + Math.random() * 1.4,
      size: 1 + Math.random() * 2.5,
      hue: [190, 154, 42, 5, 265][index % 5],
      lane: Math.floor(Math.random() * 7)
    });
  }
}

function drawGrid() {
  context.save();
  context.globalAlpha = 0.3;
  context.strokeStyle = "rgba(145, 195, 228, 0.1)";
  context.lineWidth = 1;
  for (let y = 86; y < height; y += 88) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
  for (let x = 74; x < width; x += 112) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  context.restore();
}

function drawTraces(time) {
  context.save();
  traces.forEach((trace, index) => {
    context.beginPath();
    for (let x = -10; x <= width + 10; x += 8) {
      const noise = Math.sin(x * 0.024 + time * trace.speed + trace.phase) * trace.amp;
      const spike = Math.sin(x * 0.071 + time * trace.speed * 2.2 + index) * (trace.amp * 0.25);
      const y = trace.y + noise + spike;
      if (x === -10) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.strokeStyle = `hsla(${trace.hue} 92% 62% / 0.18)`;
    context.lineWidth = 1.2;
    context.shadowColor = `hsl(${trace.hue} 92% 62%)`;
    context.shadowBlur = 9;
    context.stroke();
  });
  context.restore();
}

function drawPackets(time) {
  packets.forEach((packet, index) => {
    const laneY = height * 0.18 + packet.lane * height * 0.085;
    const y = packet.y * 0.2 + laneY * 0.8 + Math.sin(time * 0.001 + index) * 12;
    const color = `hsl(${packet.hue} 94% 62%)`;

    context.beginPath();
    context.fillStyle = color;
    context.shadowColor = color;
    context.shadowBlur = 12;
    context.arc(packet.x, y, packet.size, 0, Math.PI * 2);
    context.fill();

    if (index % 4 === 0) {
      context.beginPath();
      context.strokeStyle = `hsla(${packet.hue} 94% 62% / 0.2)`;
      context.lineWidth = 1;
      context.moveTo(packet.x - 54, y);
      context.lineTo(packet.x - 8, y);
      context.stroke();
    }

    packet.x += packet.speed;
    if (packet.x > width + 80) {
      packet.x = -80;
      packet.y = Math.random() * height;
    }
  });
}

function drawHidOrbit(time) {
  const cx = width * 0.7;
  const cy = height * 0.4;
  context.save();
  context.strokeStyle = "rgba(69, 230, 166, 0.16)";
  context.lineWidth = 2;
  for (let ring = 0; ring < 4; ring += 1) {
    const radius = 46 + ring * 44 + Math.sin(time * 0.002 + ring) * 6;
    context.beginPath();
    context.arc(cx, cy, radius, 0, Math.PI * 2);
    context.stroke();
  }

  for (let index = 0; index < 12; index += 1) {
    const angle = time * 0.00034 + index * ((Math.PI * 2) / 12);
    const radius = 78 + (index % 4) * 24;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius * 0.56;
    const hue = [190, 154, 42, 5][index % 4];
    context.beginPath();
    context.fillStyle = `hsl(${hue} 94% 62%)`;
    context.shadowColor = `hsl(${hue} 94% 62%)`;
    context.shadowBlur = 18;
    context.arc(x, y, 2.6, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

function animate(time) {
  context.clearRect(0, 0, width, height);
  drawGrid();
  drawTraces(time);
  drawPackets(time);
  drawHidOrbit(time);
  requestAnimationFrame(animate);
}

resizeCanvas();
seed();
requestAnimationFrame(animate);

window.addEventListener("resize", () => {
  resizeCanvas();
  seed();
});
