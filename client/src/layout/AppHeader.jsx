import { Typography } from '@mui/material';

import './AppHeader.css';


// AppHeader component
export default function AppHeader() {
    return (
        <div className='appheader'>
            <div className="appheader__title">
                <Typography variant="h4" fontWeight={600}>
                    Silent Transfer
                </Typography>
            </div>
        </div>
    )
}
