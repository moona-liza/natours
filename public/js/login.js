import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
    try {
        const res = await axios({
            method: 'post',
            url: 'http://127.0.0.1:3000/api/v1/users/login/',
            data: {
                email,
                password,
            },
        });
        if (res.data.status === 'success') {
            showAlert('success', 'Logged in Successfull!');
            window.setTimeout(() => {
                location.assign('/');
            }, 1000);
        }
    } catch (err) {
        showAlert('error', err.response.data.message);
    }
};

export const logout = async () => {
    try {
        const val = confirm("If Your Want to Logout \nPress 'Ok'");
        if (val === true) {
            const res = await axios({
                method: 'get',
                url: 'http://127.0.0.1:3000/api/v1/users/logout/',
            });
            if (res.data.status === 'success') location.reload(true);
        }
    } catch (error) {
        showAlert('error', 'Error Logging out! Try again.');
    }
};
