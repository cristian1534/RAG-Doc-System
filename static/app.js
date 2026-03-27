function uploadDocument() {
  var fileInput = document.getElementById("fileInput");
  var responseDiv = document.getElementById("uploadResponse");
  var uploadButton = document.getElementById("uploadButton");
  var queryButton = document.getElementById("queryButton");

  if (!fileInput.files[0]) {
    responseDiv.innerHTML =
      '<div class="response">Please select a file first.</div>';
    return;
  }

  uploadButton.disabled = true;
  queryButton.disabled = true;
  uploadButton.textContent = "Uploading...";

  var formData = new FormData();
  formData.append("file", fileInput.files[0]);

  responseDiv.innerHTML = '<div class="loading">Uploading document...</div>';

  fetch("/upload", {
    method: "POST",
    body: formData,
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (result) {
      if (result.document_id) {
        responseDiv.innerHTML =
          '<div class="response">' +
          "[SUCCESS] Document uploaded successfully!" +
          '<div class="file-info">' +
          "Document ID: " +
          result.document_id +
          "<br>" +
          "Filename: " +
          result.filename +
          "<br>" +
          "Size: " +
          result.size +
          " bytes" +
          "</div>" +
          "</div>";
        fileInput.value = "";
      } else {
        var errorMessage = result.detail || "Unknown error";
        responseDiv.innerHTML =
          '<div class="response">[ERROR] Error: ' + errorMessage + "</div>";
      }
    })
    .catch(function (error) {
      responseDiv.innerHTML =
        '<div class="response">[ERROR] Network error: ' +
        error.message +
        "</div>";
    })
    .finally(function () {
      uploadButton.disabled = false;
      queryButton.disabled = false;
      uploadButton.textContent = "Upload";
    });
}

async function loadDocuments() {
  var documentListDiv = document.getElementById("documentList");
  var documentButton = document.getElementById("documentButton");

  if (documentListDiv.style.display === "block") {
    documentListDiv.style.display = "none";
    documentButton.textContent = "Show Documents";
    return;
  }

  documentListDiv.style.display = "block";
  documentButton.textContent = "Hide Documents";

  try {
    var response = await fetch("/documents");
    var data = await response.json();

    if (data.documents.length === 0) {
      documentListDiv.innerHTML =
        '<div class="response">No documents uploaded yet.</div>';
      return;
    }

    var html = '<div class="response">';
    for (var i = 0; i < data.documents.length; i++) {
      var doc = data.documents[i];
      html +=
        '<div style="margin-bottom: 15px; padding: 10px; border-left: 3px solid #0078d4;">' +
        "<strong>Filename:</strong> " +
        doc.filename +
        "<br>" +
        "<strong>Size:</strong> " +
        doc.size +
        " bytes<br>" +
        "<button onclick=\"deleteDocument('" +
        doc.document_id +
        '\')" style="background-color: #d83b01; margin-top: 10px;">Delete Document</button>' +
        "</div>";
    }
    html += "</div>";
    documentListDiv.innerHTML = html;
  } catch (error) {
    documentListDiv.innerHTML =
      '<div class="response">[ERROR] Error loading documents: ' +
      error.message +
      "</div>";
  }
}

async function deleteDocument(documentId) {
  if (!confirm("Are you sure you want to delete this document?")) {
    return;
  }

  try {
    var response = await fetch("/documents/" + documentId, {
      method: "DELETE",
    });

    if (response.ok) {
      alert("Document deleted successfully!");
      loadDocuments(); // Refresh the list
    } else {
      var error = await response.json();
      alert("Error deleting document: " + (error.detail || "Unknown error"));
    }
  } catch (error) {
    alert("Network error: " + error.message);
  }
}

function queryDocuments() {
  var queryInput = document.getElementById("queryInput");
  var responseDiv = document.getElementById("queryResponse");
  var uploadButton = document.getElementById("uploadButton");
  var queryButton = document.getElementById("queryButton");

  if (!queryInput.value.trim()) {
    responseDiv.innerHTML =
      '<div class="response">Please enter a question.</div>';
    return;
  }

  uploadButton.disabled = true;
  queryButton.disabled = true;
  queryButton.textContent = "Processing...";

  responseDiv.innerHTML =
    '<div class="response">[AI] <strong>Response:</strong><br><br><span id="streamingResponse"></span></div>';
  var streamingSpan = document.getElementById("streamingResponse");
  streamingSpan.textContent = "";

  fetch("/query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: queryInput.value,
    }),
  })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("HTTP error! status: " + response.status);
      }
      return response.json();
    })
    .then(function (data) {
      if (data.type === "complete" && data.response) {
        streamingSpan.textContent = data.response;
        streamingSpan.innerHTML +=
          "<br><br><small>Query ID: " + data.query_id + "</small>";
      } else if (data.type === "error" && data.error) {
        responseDiv.innerHTML =
          '<div class="response">[ERROR] Error: ' + data.error + "</div>";
      } else {
        responseDiv.innerHTML =
          '<div class="response">[ERROR] Invalid response format</div>';
      }
    })
    .catch(function (error) {
      responseDiv.innerHTML =
        '<div class="response">[ERROR] Network error: ' +
        error.message +
        "</div>";
    })
    .finally(function () {
      uploadButton.disabled = false;
      queryButton.disabled = false;
      queryButton.textContent = "Query";
    });
}

async function clearHistory() {
  if (!confirm("Are you sure you want to clear all query history?")) {
    return;
  }

  try {
    var response = await fetch("/history", {
      method: "DELETE",
    });

    if (response.ok) {
      alert("History cleared successfully!");
      // Hide the history section and clear the content
      var historyDiv = document.getElementById("historyResponse");
      historyDiv.style.display = "none";
      historyDiv.innerHTML = "";
      document.getElementById("historyButton").textContent = "Show History";
    } else {
      var error = await response.json();
      alert("Error clearing history: " + (error.detail || "Unknown error"));
    }
  } catch (error) {
    alert("Network error: " + error.message);
  }
}

var historyVisible = false;

function loadHistory() {
  var historyDiv = document.getElementById("historyResponse");
  var historyButton = document.getElementById("historyButton");

  if (historyDiv.style.display === "block") {
    historyDiv.style.display = "none";
    historyButton.textContent = "Show History";
    return;
  }

  historyDiv.style.display = "block";
  historyButton.textContent = "Hide History";

  fetch("/history")
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      if (data.total === 0) {
        historyDiv.innerHTML =
          '<div class="response">No query history available.</div>';
        return;
      }

      var historyHtml = '<div class="response">';
      for (var i = 0; i < data.history.length; i++) {
        var item = data.history[i];
        var timestamp = new Date(
          parseFloat(item.timestamp) * 1000,
        ).toLocaleString();
        var responseText =
          item.response.length > 200
            ? item.response.substring(0, 200) + "..."
            : item.response;

        historyHtml +=
          '<div style="margin-bottom: 20px; padding: 10px; border-left: 3px solid #0078d4;">' +
          "<strong>Query:</strong> " +
          item.query +
          "<br>" +
          "<strong>Response:</strong> " +
          responseText +
          "<br>" +
          "<small>ID: " +
          item.query_id +
          " | " +
          timestamp +
          "</small>" +
          "</div>";
      }
      historyHtml += "</div>";
      historyDiv.innerHTML = historyHtml;
    })
    .catch(function (error) {
      historyDiv.innerHTML =
        '<div class="response">[ERROR] Error loading history: ' +
        error.message +
        "</div>";
    });
}
