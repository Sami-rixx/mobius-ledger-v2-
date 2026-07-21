import { useState, useCallback } from 'react';

/**
 * Custom hook for API calls
 * Handles loading, error, and response states
 * 
 * @param {Function} apiCall - Async function that returns a promise
 * @returns {Object} - State and functions for API interaction
 */
export function useApi(apiCall) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall(...args);
      setData(response);
      return response;
    } catch (err) {
      setError(err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  return { data, error, loading, execute };
}

/**
 * Hook for GET requests
 */
export function useFetch(url) {
  const { data, error, loading, execute } = useApi(async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  });

  const fetchData = useCallback(async () => {
    return execute(url);
  }, [execute, url]);

  return { data, error, loading, fetchData };
}

/**
 * Hook for POST requests
 */
export function usePost(url) {
  const { data, error, loading, execute } = useApi(async (url, body) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  });

  const postData = useCallback(async (body) => {
    return execute(url, body);
  }, [execute, url]);

  return { data, error, loading, postData };
}

/**
 * Hook for PUT requests
 */
export function usePut(url) {
  const { data, error, loading, execute } = useApi(async (url, body) => {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  });

  const putData = useCallback(async (body) => {
    return execute(url, body);
  }, [execute, url]);

  return { data, error, loading, putData };
}

/**
 * Hook for DELETE requests
 */
export function useDelete(url) {
  const { data, error, loading, execute } = useApi(async (url) => {
    const response = await fetch(url, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  });

  const deleteData = useCallback(async () => {
    return execute(url);
  }, [execute, url]);

  return { data, error, loading, deleteData };
}
