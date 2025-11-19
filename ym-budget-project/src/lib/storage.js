// src/lib/storage.js - File for handling browser localStorage operations
// Define a constant key name for storing budget requests in localStorage
const KEY = "budgetRequests";

// Function to load/retrieve all budget requests from localStorage
export function loadRequests() {
  try {
    // Try to get data from localStorage using our KEY
    // localStorage.getItem(KEY) returns a string or null
    // If null, use "[]" as default (empty array string)
    // JSON.parse() converts the JSON string back to a JavaScript array
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    // If JSON.parse fails (corrupted data), return empty array
    return [];
  }
}

// Function to save a new budget request to localStorage
export function saveRequest(item) {
  // First, load all existing requests from localStorage
  const list = loadRequests();
  // Add the new item to the end of the array
  list.push(item);
  // Convert the updated array to JSON string and save back to localStorage
  localStorage.setItem(KEY, JSON.stringify(list));
}

// Function to delete a specific budget request by ID
export function deleteRequest(id) {
  // Load all requests and filter out the one with matching ID
  // filter() creates a new array with all items except the one we want to delete
  const list = loadRequests().filter((r) => r.id !== id);
  // Save the filtered list (without the deleted item) back to localStorage
  localStorage.setItem(KEY, JSON.stringify(list));
}
