// import { Injectable } from '@angular/core';
// import { Auth } from 'aws-amplify';

// @Injectable({
//   providedIn: 'root'
// })
// export class UserService {

//   constructor() {}

//    // Fetch current authenticated user
//    getCurrentUser() {
//     return Auth.currentAuthenticatedUser()
//       .then((user: any) => {  
//         console.log('Authenticated user:', user);
//         return user;  // Return user details
//       })
//       .catch((err: any) => {
//         console.error('Error fetching user:', err);
//         return null;
//       });
//   }

//   // Optionally, fetch session (access and id token)
//   getCurrentSession() {
//     return Auth.currentSession()
//       .then((session: any) => {
//         console.log('Current session:', session);
//         return session;  // Return session info
//       })
//       .catch((err: any) => {
//         console.error('Error fetching session:', err);
//         return null;
//       });
//   }
// }