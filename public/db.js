let db;
// Creates a "budget" database from a new db request
const request = indexedDB.open( "budget", 1 );

// Create object store called "pending" and set autoIncrement to true
request.onupgradeneeded = function( event ) {
  const db = event.target.result;

  db.createObjectStore( "pending", { autoIncrement: true });
};

// Checks if app is online before reading from db
request.onsuccess = function( event ) {
  db = event.target.result;

  if ( navigator.onLine ) {
    checkDatabase();
  }
};

request.onerror = function( event ) {
  console.log( "Your saved transactions did not successfully load" + event.target.errorCode );
};

function saveRecord( record ) {
  // Create a transaction on the "pending" db with "readwrite" access
  const transaction = db.transaction( [ "pending" ], "readwrite" );

  // Access your "pending" object store
  const store = transaction.objectStore( "pending" );

  // Add transaction record to your store with add method.
  store.add( record );
};

function checkDatabase() {
  // Open a transaction on the "pending" db with "readwrite" access
  const transaction = db.transaction( [ "pending" ], "readwrite" );

  // Access your "pending" object store
  const store = transaction.objectStore( "pending" );

  // Get all records from store and set to a variable
  const getAll = store.getAll();

  getAll.onsuccess = function() {
    if ( getAll.result.length > 0 ) {
      fetch( "api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify( getAll.result ),
        headers: {
          Accept: "application/json, text/plain, */*", "Content-Type": "application/json"
        }
      })
      .then( response => response.json() )
      .then( () => {
        // If successful, open a transaction on your "pending" db
        const transaction = db.transaction( ["pending"], "readwrite" );

        // Access your "pending" object store
        const store = transaction.objectStore("pending");

        // Clear all items in your store
        store.clear();
      });
    }
  };
}

// Listen for app to come back online
window.addEventListener( "online", checkDatabase );