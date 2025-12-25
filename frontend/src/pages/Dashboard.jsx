import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { Button, TextField, Card, CardContent, Typography, List, CardActionArea, IconButton } from '@mui/material';
import { AuthContext } from '../contexts/AuthContext';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import HistoryIcon from '@mui/icons-material/History';


export default function Dashboard() {


    const router = useNavigate();
    const { getHistoryOfUser } = React.useContext(AuthContext);

    const [meetingCode, setMeetingCode] = useState("")
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const historyData = await getHistoryOfUser();
                setHistory(historyData);
            } catch (e) {
                console.log(e);
            }
        }

        fetchHistory();
    }, [])

    return (
        <div className="dashboard-container">
            {/* Left Side: Create/Join Meeting */}
            <div style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <Typography variant="h3" style={{ fontWeight: 700, marginBottom: '2rem' }}>
                    Welcome Back,
                </Typography>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', width: '100%', maxWidth: '400px' }}>
                    <TextField
                        fullWidth
                        label="Enter Meeting Code"
                        variant="outlined"
                        value={meetingCode}
                        onChange={(e) => setMeetingCode(e.target.value)}
                        InputProps={{
                            style: { color: 'white' }
                        }}
                        InputLabelProps={{
                            style: { color: '#aaa' }
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': { borderColor: '#555' },
                                '&:hover fieldset': { borderColor: '#888' },
                                '&.Mui-focused fieldset': { borderColor: '#FF9839' },
                            }
                        }}
                    />
                    <Button
                        variant="contained"
                        style={{ backgroundColor: '#FF9839', color: 'black', fontWeight: 'bold' }}
                        onClick={() => router(`/${meetingCode}`)}
                        disabled={!meetingCode}
                    >
                        Join
                    </Button>
                </div>
            </div>

            {/* Right Side: History */}
            <div style={{ flex: 1, borderLeft: '1px solid #333', padding: '40px', overflowY: 'auto', backgroundColor: '#181818' }}>
                <Typography variant="h5" gutterBottom style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#FF9839' }}>
                    <HistoryIcon /> Past Meetings
                </Typography>
                <List>
                    {history.map((meeting) => (
                        <Card key={meeting._id} variant="outlined" style={{ marginBottom: '15px', backgroundColor: '#252525', borderColor: '#444' }}>
                            <CardActionArea onClick={() => { router(`/${meeting.meetingCode}`) }}>
                                <CardContent style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: 'white' }}>
                                    <div>
                                        <Typography variant="subtitle1" style={{ fontWeight: 600 }}>
                                            Code: {meeting.meetingCode}
                                        </Typography>
                                        <Typography variant="body2" color="gray">
                                            {new Date(meeting.date).toLocaleDateString()}
                                        </Typography>
                                    </div>
                                    <MeetingRoomIcon style={{ color: '#FF9839' }} />
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    ))}
                    {history.length === 0 && <Typography style={{ color: '#777' }}>No past meetings found.</Typography>}
                </List>
            </div>
        </div>
    )
}
