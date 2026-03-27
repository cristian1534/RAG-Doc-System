// Toast Notification System
function showToast(message, type = "info", duration = 3000) {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type} fade-in`;

  const icons = {
    success: "fa-check-circle",
    error: "fa-exclamation-circle",
    warning: "fa-exclamation-triangle",
    info: "fa-info-circle",
  };

  toast.innerHTML = `
    <i class="fas ${icons[type]}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("hiding");
    setTimeout(() => {
      container.removeChild(toast);
    }, 300);
  }, duration);
}

// Modern Confirmation Modal
function showConfirmModal(title, message, onConfirm, onCancel = null) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const modal = document.createElement("div");
  modal.className = "modal";

  modal.innerHTML = `
    <div class="modal-header">
      <i class="fas fa-exclamation-triangle text-red-500 text-xl"></i>
      <h3 class="modal-title">${title}</h3>
    </div>
    <p class="modal-message">${message}</p>
    <div class="modal-buttons">
      <button class="btn-modal btn-modal-secondary" onclick="closeModal(this)">Cancel</button>
      <button class="btn-modal btn-modal-primary" onclick="confirmModal(this)">Confirm</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  window.closeModal = function (button) {
    const overlay = button.closest(".modal-overlay");
    document.body.removeChild(overlay);
    if (onCancel) onCancel();
  };

  window.confirmModal = function (button) {
    const overlay = button.closest(".modal-overlay");
    document.body.removeChild(overlay);
    if (onConfirm) onConfirm();
  };
}

function uploadDocument() {
  var fileInput = document.getElementById("fileInput");
  var responseDiv = document.getElementById("uploadResponse");
  var uploadButton = document.getElementById("uploadButton");
  var queryButton = document.getElementById("queryButton");

  if (!fileInput.files[0]) {
    responseDiv.innerHTML =
      '<div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg fade-in"><div class="flex"><i class="fas fa-exclamation-circle text-red-500 mr-3 mt-1"></i><div><p class="text-red-700 font-medium">Please select a file first.</p></div></div></div>';
    return;
  }

  uploadButton.disabled = true;
  queryButton.disabled = true;
  uploadButton.innerHTML =
    '<i class="fas fa-spinner fa-spin mr-2"></i>Uploading...';

  var formData = new FormData();
  formData.append("file", fileInput.files[0]);

  responseDiv.innerHTML =
    '<div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg fade-in"><div class="flex"><i class="fas fa-cloud-upload-alt text-blue-500 mr-3 mt-1"></i><div><p class="text-blue-700 font-medium">Uploading document...</p></div></div></div>';

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
          '<div class="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg fade-in"><div class="flex"><i class="fas fa-check-circle text-green-500 mr-3 mt-1"></i><div><p class="text-green-700 font-medium">Document uploaded successfully!</p><div class="mt-2 text-sm text-gray-600"><p><strong>Document ID:</strong> ' +
          result.document_id +
          "</p><p><strong>Filename:</strong> " +
          result.filename +
          "</p><p><strong>Size:</strong> " +
          result.size +
          " bytes</p></div></div></div></div>';
        showToast('Document uploaded successfully!', 'success');
        fileInput.value = "";
      } else {
        var errorMessage = result.detail || "Unknown error";
        responseDiv.innerHTML =
          '<div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg fade-in"><div class="flex"><i class="fas fa-exclamation-circle text-red-500 mr-3 mt-1"></i><div><p class="text-red-700 font-medium">Error: ' +
          errorMessage +
          "</p></div></div></div>";
        showToast('Upload failed: ' + errorMessage, 'error');
      }
    })
    .catch(function (error) {
      responseDiv.innerHTML =
        '<div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg fade-in"><div class="flex"><i class="fas fa-exclamation-circle text-red-500 mr-3 mt-1"></i><div><p class="text-red-700 font-medium">Network error: ' +
        error.message +
        "</p></div></div></div>";
      showToast('Network error: ' + error.message, 'error');
    })
    .finally(function () {
      uploadButton.disabled = false;
      queryButton.disabled = false;
      uploadButton.innerHTML =
        '<i class="fas fa-cloud-upload-alt mr-2"></i>Upload';
    });
}

async function loadDocuments() {
  var documentListDiv = document.getElementById("documentList");
  var documentButton = document.getElementById("documentButton");

  if (documentListDiv.style.display === "block") {
    documentListDiv.style.display = "none";
    documentButton.innerHTML = '<i class="fas fa-list mr-2"></i>Show Documents';
    return;
  }

  documentListDiv.style.display = "block";
  documentButton.innerHTML =
    '<i class="fas fa-eye-slash mr-2"></i>Hide Documents';

  try {
    var response = await fetch("/documents");
    var data = await response.json();

    if (data.documents.length === 0) {
      documentListDiv.innerHTML =
        '<div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg fade-in"><div class="flex"><i class="fas fa-info-circle text-yellow-500 mr-3 mt-1"></i><div><p class="text-yellow-700 font-medium">No documents uploaded yet.</p></div></div></div>';
      return;
    }

    var html = '<div class="space-y-3">';
    for (var i = 0; i < data.documents.length; i++) {
      var doc = data.documents[i];
      html +=
        '<div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow fade-in">' +
        '<div class="flex items-start justify-between">' +
        '<div class="flex-1">' +
        '<h4 class="font-semibold text-gray-800 mb-2"><i class="fas fa-file-alt text-blue-500 mr-2"></i>' +
        doc.filename +
        "</h4>" +
        '<p class="text-sm text-gray-600"><strong>Size:</strong> ' +
        doc.size +
        " bytes</p>" +
        "</div>" +
        "<button onclick=\"deleteDocument('" +
        doc.document_id +
        '\')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"><i class="fas fa-trash mr-1"></i>Delete</button>' +
        "</div>" +
        "</div>";
    }
    html += "</div>";
    documentListDiv.innerHTML = html;
  } catch (error) {
    documentListDiv.innerHTML =
      '<div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg fade-in"><div class="flex"><i class="fas fa-exclamation-circle text-red-500 mr-3 mt-1"></i><div><p class="text-red-700 font-medium">Error loading documents: ' +
      error.message +
      "</p></div></div></div>";
  }
}

async function deleteDocument(documentId) {
  showConfirmModal(
    'Delete Document',
    'Are you sure you want to delete this document? This action cannot be undone.',
    function() {
      fetch("/documents/" + documentId, {
        method: "DELETE",
      })
      .then(function (response) {
        if (response.ok) {
          showToast('Document deleted successfully!', 'success');
          loadDocuments(); // Refresh the list
        } else {
          return response.json().then(function(error) {
            throw new Error(error.detail || "Unknown error");
          });
        }
      })
      .catch(function (error) {
        showToast('Error deleting document: ' + error.message, 'error');
      });
    }
  );
}

function queryDocuments() {
  var queryInput = document.getElementById("queryInput");
  var responseDiv = document.getElementById("queryResponse");
  var uploadButton = document.getElementById("uploadButton");
  var queryButton = document.getElementById("queryButton");

  if (!queryInput.value.trim()) {
    responseDiv.innerHTML =
      '<div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg fade-in"><div class="flex"><i class="fas fa-exclamation-circle text-red-500 mr-3 mt-1"></i><div><p class="text-red-700 font-medium">Please enter a question.</p></div></div></div>';
    return;
  }

  uploadButton.disabled = true;
  queryButton.disabled = true;
  queryButton.innerHTML =
    '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';

  responseDiv.innerHTML =
    '<div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg fade-in"><div class="flex"><i class="fas fa-robot text-blue-500 mr-3 mt-1"></i><div><p class="text-blue-700 font-medium">AI Response:</p><div class="mt-3 text-gray-800 whitespace-pre-wrap" id="streamingResponse"></div></div></div></div>';
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
        responseDiv.innerHTML =
          '<div class="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg fade-in"><div class="flex"><i class="fas fa-check-circle text-green-500 mr-3 mt-1"></i><div><p class="text-green-700 font-medium">AI Response:</p><div class="mt-3 text-gray-800 whitespace-pre-wrap">' +
          data.response +
          '</div><div class="mt-3 text-xs text-gray-500"><i class="fas fa-hashtag mr-1"></i>Query ID: ' +
          data.query_id +
          "</div></div></div></div>";
      } else if (data.type === "error" && data.error) {
        responseDiv.innerHTML =
          '<div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg fade-in"><div class="flex"><i class="fas fa-exclamation-circle text-red-500 mr-3 mt-1"></i><div><p class="text-red-700 font-medium">Error: ' +
          data.error +
          "</p></div></div></div>";
      } else {
        responseDiv.innerHTML =
          '<div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg fade-in"><div class="flex"><i class="fas fa-exclamation-circle text-red-500 mr-3 mt-1"></i><div><p class="text-red-700 font-medium">Invalid response format</p></div></div></div>';
      }
    })
    .catch(function (error) {
      responseDiv.innerHTML =
        '<div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg fade-in"><div class="flex"><i class="fas fa-exclamation-circle text-red-500 mr-3 mt-1"></i><div><p class="text-red-700 font-medium">Network error: ' +
        error.message +
        "</p></div></div></div>";
    })
    .finally(function () {
      uploadButton.disabled = false;
      queryButton.disabled = false;
      queryButton.innerHTML = '<i class="fas fa-search mr-2"></i>Query';
    });
}

async function clearHistory() {
  showConfirmModal(
    'Clear History',
    'Are you sure you want to clear all query history? This action cannot be undone.',
    function() {
      fetch("/history", {
        method: "DELETE",
      })
      .then(function (response) {
        if (response.ok) {
          showToast('History cleared successfully!', 'success');
          // Hide the history section and clear the content
          var historyDiv = document.getElementById("historyResponse");
          historyDiv.style.display = "none";
          historyDiv.innerHTML = "";
          document.getElementById("historyButton").innerHTML =
            '<i class="fas fa-clock mr-2"></i>Show History';
        } else {
          return response.json().then(function(error) {
            throw new Error(error.detail || "Unknown error");
          });
        }
      })
      .catch(function (error) {
        showToast('Error clearing history: ' + error.message, 'error');
      });
    }
  );
}

var historyVisible = false;

function loadHistory() {
  var historyDiv = document.getElementById("historyResponse");
  var historyButton = document.getElementById("historyButton");

  if (historyDiv.style.display === "block") {
    historyDiv.style.display = "none";
    historyButton.innerHTML = '<i class="fas fa-clock mr-2"></i>Show History';
    return;
  }

  historyDiv.style.display = "block";
  historyButton.innerHTML = '<i class="fas fa-eye-slash mr-2"></i>Hide History';

  fetch("/history")
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      if (data.total === 0) {
        historyDiv.innerHTML =
          '<div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg fade-in"><div class="flex"><i class="fas fa-info-circle text-yellow-500 mr-3 mt-1"></i><div><p class="text-yellow-700 font-medium">No query history available.</p></div></div></div>';
        return;
      }

      var historyHtml = '<div class="space-y-3">';
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
          '<div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow fade-in">' +
          '<div class="mb-2"><h4 class="font-semibold text-gray-800"><i class="fas fa-question-circle text-blue-500 mr-2"></i>' +
          item.query +
          "</h4></div>" +
          '<div class="mb-2"><p class="text-sm text-gray-700"><i class="fas fa-reply text-green-500 mr-2"></i>' +
          responseText +
          "</p></div>" +
          '<div class="text-xs text-gray-500"><i class="fas fa-hashtag mr-1"></i>' +
          item.query_id +
          ' • <i class="fas fa-clock mr-1"></i>' +
          timestamp +
          "</div>" +
          "</div>";
      }
      historyHtml += "</div>";
      historyDiv.innerHTML = historyHtml;
    })
    .catch(function (error) {
      historyDiv.innerHTML =
        '<div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg fade-in"><div class="flex"><i class="fas fa-exclamation-circle text-red-500 mr-3 mt-1"></i><div><p class="text-red-700 font-medium">Error loading history: ' +
        error.message +
        "</p></div></div></div>";
    });
}
