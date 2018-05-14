var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var cardTemplate=document.querySelector('.card-template');
var container=document.querySelector('.cards-section');
var form =document.querySelector('form');
var titleInput = document.querySelector('#title');
var locationInput = document.querySelector('#location');


function openCreatePostModal() {
  createPostArea.style.display = 'block';
  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then(function(choiceResult) {
      console.log(choiceResult.outcome);

      if (choiceResult.outcome === 'dismissed') {
        console.log('User cancelled installation');
      } else {
        console.log('User added to home screen');
      }
    });

    deferredPrompt = null;
  }

  // if ('serviceWorker' in navigator) {
  //   navigator.serviceWorker.getRegistrations()
  //     .then(function(registrations) {
  //       for (var i = 0; i < registrations.length; i++) {
  //         registrations[i].unregister();
  //       }
  //     })
  // }
}

function closeCreatePostModal() {
  createPostArea.style.transform = 'translateY(100vh)';

  // createPostArea.style.display = 'none';
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

// Currently not in use, allows to save assets in cache on demand otherwise
// function onSaveButtonClicked(event) {
//   console.log('clicked');
//   if ('caches' in window) {
//     caches.open('user-requested')
//       .then(function(cache) {
//         cache.add('https://httpbin.org/get');
//         cache.add('/src/images/sf-boat.jpg');
//       });
//   }
// }

// function clearCards() {
//   while(sharedMomentsArea.hasChildNodes()) {
//     sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
//   }
// }

function createCard(newsObj) {
  var card;
  console.log('Inside Card'+newsObj);
  card = cardTemplate.cloneNode(true);
  card.classList.remove('card-template');
  card.removeAttribute('hidden');

  card.querySelector('.card-title').textContent = newsObj.title;
  card.querySelector('.card-content').textContent = newsObj.description;
  card.querySelector('.card-action a').setAttribute('href', newsObj.url);
  // card.querySelector('.card-action a').textContent =newsObj.source.name;
  card.querySelector('.card-image img').setAttribute('src', newsObj.urlToImage);
  container.appendChild(card);
}

var url = 'https://newsapi.org/v2/top-headlines?country=in&apiKey=09276aed4a624bc7bda25094d7ec29f5';
var networkDataReceived = false;

fetch(url)
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    networkDataReceived = true;
    console.log('From web', data);
    for (var i = 0; i < data.articles.length; i++) {
      createCard(data.articles[i]);
  }
  });

if ('caches' in window) {
  caches.match(url)
    .then(function(response) {
      if (response) {
        return response.json();
      }
    })
    .then(function(data) {
      console.log('From cache', data);
      if (!networkDataReceived) {
        for (var i = 0; i < data.articles.length; i++) {
          createCard(data.articles[i]);
      }
      }
    });
}
function sendData() {
  fetch('https://httpbin.org/post', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      id: new Date().toISOString(),
      title: titleInput.value,
      location: locationInput.value      
    })
  })
    .then(function(res) {
      console.log('Sent data', res);
    })
}

form.addEventListener('submit', function(event) {
  event.preventDefault();

  if (titleInput.value.trim() === '' || locationInput.value.trim() === '') {
    alert('Please enter valid data!');
    return;
  }

  closeCreatePostModal();

  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready
      .then(function(sw) {
        var post = {
          id: new Date().toISOString(),
          title: titleInput.value,
          location: locationInput.value
        };
        writeData('sync-posts', post)
          .then(function() {
            return sw.sync.register('sync-new-posts');
          })
          .then(function() {
            var snackbarContainer = document.querySelector('#confirmation-toast');
            var data = {message: 'Your Post was saved for syncing!'};
            snackbarContainer.MaterialSnackbar.showSnackbar(data);
          })
          .catch(function(err) {
            console.log(err);
          });
      });
  } else {
    sendData();
  }
});