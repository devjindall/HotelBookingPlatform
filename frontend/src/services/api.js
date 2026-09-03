const BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Universal fetch wrapper that automatically attaches JWT tokens and standardizes errors
 */
export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data?.error?.message || data?.message || `Request failed with status ${response.status}`;
      const errorCode = data?.error?.code || 'API_ERROR';
      const error = new Error(errorMsg);
      error.status = response.status;
      error.code = errorCode;
      throw error;
    }

    return data;
  } catch (err) {
    if (!err.status) {
      err.status = 500;
      err.code = 'NETWORK_ERROR';
      err.message = err.message || 'Cannot connect to server. Please ensure backend is running.';
    }
    throw err;
  }
}

// 1. Auth Service
export const authService = {
  register: (name, email, password) => 
    apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    }),

  login: (email, password) => 
    apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  getMe: () => 
    apiRequest('/api/auth/me')
};

// 2. Hotel Service
export const hotelService = {
  getHotels: (params = {}) => {
    const query = new URLSearchParams();
    if (params.city) query.append('city', params.city);
    if (params.maxPrice) query.append('maxPrice', params.maxPrice);
    if (params.minRating) query.append('minRating', params.minRating);
    if (params.breakfast !== undefined && params.breakfast !== '') query.append('breakfast', params.breakfast);
    if (params.guests) query.append('guests', params.guests);
    if (params.search) query.append('search', params.search);

    const qs = query.toString();
    return apiRequest(`/api/hotels${qs ? `?${qs}` : ''}`);
  },

  getHotelById: (id) => 
    apiRequest(`/api/hotels/${id}`),

  getHotelRooms: (hotelId, params = {}) => {
    const query = new URLSearchParams();
    if (params.checkIn) query.append('checkIn', params.checkIn);
    if (params.checkOut) query.append('checkOut', params.checkOut);
    if (params.guests) query.append('guests', params.guests);

    const qs = query.toString();
    return apiRequest(`/api/hotels/${hotelId}/rooms${qs ? `?${qs}` : ''}`);
  }
};

// 3. Booking Service
export const bookingService = {
  createBooking: (bookingData) => 
    apiRequest('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData)
    }),

  getMyBookings: () => 
    apiRequest('/api/bookings'),

  getBookingById: (id) => 
    apiRequest(`/api/bookings/${id}`),

  cancelBooking: (id) => 
    apiRequest(`/api/bookings/${id}/cancel`, {
      method: 'PATCH'
    })
};

// 4. AI Service
export const aiService = {
  getRecommendations: (prompt) => 
    apiRequest('/api/ai/recommend', {
      method: 'POST',
      body: JSON.stringify({ prompt })
    })
};
