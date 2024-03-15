// /* eslint-disable */
// const stripe = Stripe('pk_test_51OtSIhKbkfapZDNzXUNX3kSfiMDe34M5d3wB1lvZo4uNnU4GUF0jWv9sRYWp2x6szJDS7aKDREAG2uHwXUdx9qmo004EJ3YTlv'); 
// import axios from 'axios';
// import { showAlert } from './alerts';
 
// export const bookTour = async tourId => {
//   try {
//     // 1) Get checkout session from API
//     const session = await axios(
//       `http://127.0.0.1:3000/api/v1/booking/checkout-session/${tourId}`
//     );
//     console.log(session); 

//     // 2) Create checkout form + chanre credit card
//     await stripe.redirectToCheckout({
//       sessionId: session.data.session.id
//     });
//   } catch (err) { 
//     console.log(err); 
//     showAlert('error', err);
//   }
// };
