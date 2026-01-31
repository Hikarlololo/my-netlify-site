// FloraScan: upload, camera capture, identify (Flask API or fallback)
document.addEventListener("DOMContentLoaded", () => {
  const photoInput = document.getElementById("photoInput");
  const cameraInput = document.getElementById("cameraInput");
  const photoUploadArea = document.getElementById("photoUploadArea");
  const uploadPlaceholder = document.getElementById("uploadPlaceholder");
  const previewImage = document.getElementById("previewImage");
  const uploadBtn = document.getElementById("uploadBtn");
  const cameraBtn = document.getElementById("cameraBtn");
  const cameraLive = document.getElementById("cameraLive");
  const cameraVideo = document.getElementById("cameraVideo");
  const captureBtn = document.getElementById("captureBtn");
  const closeCameraBtn = document.getElementById("closeCameraBtn");
  const askButton = document.getElementById("askButton");
  const plantDescription = document.getElementById("plantDescription");

  if (!photoUploadArea || !previewImage || !askButton) return;

  // API base: use same origin when served by Flask
  const apiBase = window.location.origin;

  function setPreviewFromDataUrl(dataUrl) {
    previewImage.src = dataUrl;
    previewImage.style.display = "block";
    photoUploadArea.classList.add("has-image");
    if (uploadPlaceholder) uploadPlaceholder.style.display = "none";
    if (cameraLive) cameraLive.style.display = "none";
  }

  function clearPreview() {
    previewImage.src = "";
    previewImage.style.display = "none";
    photoUploadArea.classList.remove("has-image");
    if (uploadPlaceholder) uploadPlaceholder.style.display = "flex";
    if (cameraLive) cameraLive.style.display = "none";
    if (photoInput) photoInput.value = "";
    if (cameraInput) cameraInput.value = "";
  }

  function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setPreviewFromDataUrl(e.target.result);
    reader.readAsDataURL(file);
  }

  // Upload button: open file picker (no camera)
  if (uploadBtn && photoInput) {
    uploadBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      photoInput.removeAttribute("capture");
      photoInput.click();
    });
  }

  // Take photo: on mobile use input with capture; on desktop try getUserMedia
  if (cameraBtn) {
    cameraBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile && cameraInput) {
        cameraInput.click();
      } else {
        startCamera();
      }
    });
  }

  if (photoInput) photoInput.addEventListener("change", (e) => { handleFile(e.target.files[0]); });
  if (cameraInput) cameraInput.addEventListener("change", (e) => { handleFile(e.target.files[0]); });

  // HTML5 camera: getUserMedia
  let cameraStream = null;
  function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (cameraInput) cameraInput.click();
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((stream) => {
        cameraStream = stream;
        if (cameraVideo) cameraVideo.srcObject = stream;
        if (uploadPlaceholder) uploadPlaceholder.style.display = "none";
        if (cameraLive) cameraLive.style.display = "block";
      })
      .catch(() => {
        if (cameraInput) cameraInput.click();
      });
  }

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      cameraStream = null;
    }
    if (cameraVideo) cameraVideo.srcObject = null;
    if (cameraLive) cameraLive.style.display = "none";
    if (uploadPlaceholder) uploadPlaceholder.style.display = "flex";
  }

  if (captureBtn && cameraVideo) {
    captureBtn.addEventListener("click", () => {
      const canvas = document.createElement("canvas");
      canvas.width = cameraVideo.videoWidth;
      canvas.height = cameraVideo.videoHeight;
      canvas.getContext("2d").drawImage(cameraVideo, 0, 0);
      setPreviewFromDataUrl(canvas.toDataURL("image/jpeg", 0.9));
      stopCamera();
    });
  }
  if (closeCameraBtn) closeCameraBtn.addEventListener("click", stopCamera);

  // Click on upload area (but not buttons) still opens upload
  photoUploadArea.addEventListener("click", (e) => {
    if (e.target === previewImage) return;
    if (uploadBtn && e.target === uploadBtn) return;
    if (cameraBtn && e.target === cameraBtn) return;
    if (uploadPlaceholder && uploadPlaceholder.contains(e.target)) {
      photoInput.removeAttribute("capture");
      if (photoInput) photoInput.click();
    }
  });

  // Identify: call Flask API if available, else use client-side data
  askButton.addEventListener("click", async () => {
    const hasPhoto = previewImage.style.display === "block" && previewImage.src;
    const hasDescription = plantDescription ? plantDescription.value.trim() : "";

    if (!hasPhoto && !hasDescription) {
      alert("Please upload a photo or take a picture first.");
      return;
    }

    let resultData = null;
    if (hasPhoto) {
      try {
        const res = await fetch(apiBase + "/api/identify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: previewImage.src })
        });
        if (res.ok) {
          const data = await res.json();
          resultData = {
            name: data.name || "Identified Plant",
            scientificName: data.scientificName || "—",
            family: data.family || "—",
            definition: data.definition || data.description || "",
            confidence: data.confidence || "85%",
            category: data.category || "Ornamental",
            origin: data.origin || "Philippines",
            description: data.description || data.definition || "",
            characteristics: Array.isArray(data.characteristics) ? data.characteristics : ["—"],
            care: data.care || "",
            image: data.image || previewImage.src
          };
        }
      } catch (_) {}
    }

    if (!resultData) {
      resultData = {
        name: hasDescription ? hasDescription.split(" ")[0] + " Plant" : "Identified Plant",
        scientificName: "Scientific name pending analysis",
        family: "—",
        definition: "",
        confidence: "85%",
        category: "Ornamental",
        origin: "Philippines",
        description: hasPhoto ? "Identified from your photo." : `Based on your description "${hasDescription}".`,
        characteristics: ["Green foliage", "Native species", "Adaptable"],
        care: "Provide adequate water and sunlight.",
        image: hasPhoto ? previewImage.src : ""
      };
    }

    localStorage.setItem("plantResult", JSON.stringify(resultData));
    window.location.href = "result.html";
  });

  // Remove photo on preview click
  previewImage.addEventListener("click", (e) => {
    e.stopPropagation();
    if (confirm("Remove this photo?")) clearPreview();
  });
});
