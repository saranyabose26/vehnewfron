import { React, useState } from 'react';
import instance from '../AxiosInstance/axiosinstance';
import { loadStripe } from '@stripe/stripe-js';
import { useNavigate } from 'react-router-dom';

export const AppoimentBooking = ({ allServiceDetails, user, trackVehicle, token }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [appoinmentDate, setAppoinmentDate] = useState('');
    const [service, setService] = useState(allServiceDetails[0]?.ServiceName || '');
    const [successMessage, setSuccessMessage] = useState(null);

    const navigate = useNavigate();

    // Function to book appointment
    async function appoinmentBooking(e) {
        e.preventDefault();

        const data = {
            email: localStorage.getItem('email'),
            customerName: user,
            phoneNumber: phoneNumber,
            vehicleNumber: vehicleNumber,
            appoinmentDate: appoinmentDate,
            service: service
        };

        // API call for Appointment Booking
        await instance.post('HomePage/AppointmentBook', data, {
            headers: {
                'token': token
            }
        }).then((res) => {
            if (res.data.message === 'Appoiment added') {
                setPhoneNumber('');
                setVehicleNumber('');
                setSuccessMessage('Your appointment is booked! You will receive an email on the appointment date.');
            } else if (res.data.message === 'unAuthorized') {
                navigate('/');
            }
        }).catch(err => console.log(err));
    }

    // Function for stripe payment gateway
    async function paymentProcess(amount, service, id) {
        const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
        try {
            const data = {
                service: service,
                payment: amount,
                user: user
            };
            localStorage.setItem('Id', id);

            // API call for payment 
            await instance.post('HomePage/payment', data, {
                headers: {
                    'token': token
                }
            }).then((res) => {
                if (res.data.message === 'Payment success') {
                    stripe.redirectToCheckout({
                        sessionId: res.data.session.id,
                    });
                } else {
                    navigate('/');
                }
            });
        } catch (e) {
            console.log(e);
        }
    }

    return (
        <>
            <div className='container-fluid d-flex flex-column' id='containerAP'>
                <div className='m-auto w-50 h-75 rounded my-3'>
                    <h3 className='bg-dark text-white text-center m-0'>Appointment Booking</h3>
                    <div className='w-100 h-100 d-flex flex-column p-3' id='formcontentAP'>
                        <div className='w-75 h-50 m-auto'>
                            <form onSubmit={appoinmentBooking}>
                                <div className='row mb-3'>
                                    <label htmlFor='customerName' className='col-lg-5 col-md-auto col-form-label'>Customer Name</label>
                                    <div className='col'>
                                        <input type="text" className='form-control' id='customerName' value={user} disabled />
                                    </div>
                                </div>

                                <div className='row mb-3'>
                                    <label htmlFor='phoneNumber' className='col-lg-5 col-md-auto col-form-label'>Phone Number</label>
                                    <div className='col'>
                                        <input type="number" className='form-control' id='phoneNumber' value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                                    </div>
                                </div>

                                <div className='row mb-3'>
                                    <label htmlFor='vehicleNumber' className='col-lg-5 col-md-auto col-form-label'>Vehicle Number</label>
                                    <div className='col'>
                                        <input type="text" className='form-control' id='vehicleNumber' value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} />
                                    </div>
                                </div>

                                <div className='row mb-3'>
                                    <label htmlFor='appoinment' className='col-lg-5 col-md-auto col-form-label'>Available Appointments Dates</label>
                                    <div className='col'>
                                        <select className='form-control' id='appoinment' value={appoinmentDate} onChange={(e) => setAppoinmentDate(e.target.value)}>
                                            <option value="2024/8/2">2024/8/02</option>
                                            <option value="2024/8/3">2024/8/03</option>
                                            <option value="2024/8/4">2024/8/04</option>
                                            {/* Add more options dynamically if needed */}
                                        </select>
                                    </div>
                                </div>

                                <div className='row mb-3'>
                                    <label htmlFor='typeofservice' className='col-lg-5 col-md-auto col-form-label'>Type of Service</label>
                                    <div className='col'>
                                        <select className='form-control' id='typeofservice' value={service} onChange={(e) => setService(e.target.value)}>
                                            {allServiceDetails.map((val) => (
                                                <option key={val.ServiceName} value={val.ServiceName}>
                                                    {val.ServiceName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {successMessage && (
                                    <div className='mb-3 text-center'>
                                        <label className='form-text text-success'>{successMessage}</label>
                                    </div>
                                )}

                                <button className='btn bg-dark text-white d-flex mx-auto'>Book Appointment</button>
                            </form>
                        </div>
                    </div>
                </div>
                <hr />
            </div>

            <h1 className='text-center mt-5'>Track your vehicle</h1>

            {trackVehicle && trackVehicle.map((val) => (
                <div className='trackAP mx-auto w-75 my-5 border rounded' key={val.vehicleNumber}>
                    <span className='h5'>Vehicle Number: </span> <span className='h5'>{val.vehicleNumber}</span>
                    <div className='row my-5 mx-auto'>
                        <StatusComponent status={val.work} stage="workstarted" label="Work Started" />
                        <StatusComponent status={val.work} stage="workonprocess" label="Work On process" />
                        <StatusComponent status={val.work} stage="fiftypercentofworkcompleted" label="Fifty percent work completed" />
                        <StatusComponent status={val.work} stage="workgoingtocomplete" label="Work Going to complete" />
                        <StatusComponent status={val.work} stage="workcompleted" label="Work completed" />
                    </div>
                    <div className='d-flex justify-content-between px-3 mb-3'>
                        {val.work === 'workcompleted' && (
                            <span className='h4'>Amount : {val.serviceAmount} ₹</span>
                        )}
                        <button className='btn bg-dark text-white' onClick={() => paymentProcess(val.serviceAmount, val.service, val.id)}>
                            {val.work === 'workcompleted' ? 'Pay' : 'Pay (Disabled)'}
                        </button>
                    </div>
                </div>
            ))}
        </>
    );
};

// Helper component to manage service status
const StatusComponent = ({ status, stage, label }) => (
    <div className={`col-lg-2 col-md-auto text-center ${status === stage ? 'bg-dark text-white' : 'bg-light'}`}>
        <h5>{label}</h5>
    </div>
);
