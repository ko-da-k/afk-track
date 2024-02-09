import axios from 'axios';

const callSlackAPI = (url: string, params: URLSearchParams) => {
    const headers = {
        'Content-type': 'application/x-www-form-urlencoded',
    };
    axios.post(url, params, { headers })
        .then(response => {
            console.log('Response:', response.data);
        })
        .catch(error => {
            console.error('Error:', error.response?.data || error.message);
        });
}

export const updateStatus = (away: boolean) => {
    const apiUrl = 'https://slack.com/api/users.profile.set';
    const params = new URLSearchParams();
    params.append('token', import.meta.env.VITE_SLACK_USER_TOKEN)
    params.append('profile', away ? `{status_emoji: ":no_entry:", status_text: "家庭対応のため離席中"}` : `{status_emoji: "", status_text: ""}`);
    callSlackAPI(apiUrl, params);
}

export const updatePresence = (away: boolean) => {
    const apiUrl = 'https://slack.com/api/users.setPresence';
    const params = new URLSearchParams();
    params.append('token', import.meta.env.VITE_SLACK_USER_TOKEN)
    params.append('presence', away ? 'away' : 'auto');
    callSlackAPI(apiUrl, params); 
}
