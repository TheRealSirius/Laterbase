const API_BASE = '/api';

const request = async (path, options = {}) => {
    const response = await fetch(`${API_BASE}${path}`, {
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || 'Local save failed');
    }

    return data;
};

export const fetchState = () => request('/state');

export const saveState = ({ products, categories, settings }) => request('/state', {
    method: 'PUT',
    body: JSON.stringify({ products, categories, settings }),
});

export const fetchProductPreview = (url) => request('/product-preview', {
    method: 'POST',
    body: JSON.stringify({ url }),
});

export const getCurrentUser = () => request('/auth/me');

export const login = ({ email, password }) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
});

export const logout = () => request('/auth/logout', {
    method: 'POST',
});

export const updateAccount = ({ email, currentPassword, newPassword }) => request('/auth/account', {
    method: 'PUT',
    body: JSON.stringify({ email, currentPassword, newPassword }),
});
