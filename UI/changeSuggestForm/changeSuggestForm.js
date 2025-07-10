document.addEventListener("DOMContentLoaded", function () 
{
  const dropdownItems = document.querySelectorAll(".dropdown-item");
  const dropdownButton = document.getElementById("dropdownMenuButton");

  dropdownItems.forEach(item => {
    item.addEventListener("click", function (e) {
      dropdownButton.textContent = this.textContent; 
    });
  });
});

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("changeSuggestForm");
    const dropdownButton = document.getElementById("dropdownMenuButton");
    const messageInput = document.getElementById("messageInput");
  
    form.addEventListener("submit", function (e) {
      e.preventDefault();
  
      const selectedOption = dropdownButton.textContent.trim();
      const message = messageInput.value.trim();
  
      if (selectedOption === "Condition") {
        alert("Please select a valid option.");
        return;
      }

      console.log("Selected Option:", selectedOption);
      console.log("Message:", message);

      fetch('http://localhost:3978/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: selectedOption,
          message: message
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log('Success:', data);
        alert("Suggestion submitted successfully!");
      })
      .catch(error => {
        console.error('Error:', error);
        alert("There was an error submitting your suggestion. Please try again.");
      });

      form.reset();
    });
});