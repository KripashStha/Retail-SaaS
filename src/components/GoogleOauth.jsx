import React from 'react'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '@/firebase/dbConfig';
import { Button } from './ui/button';

function GoogleOauth() {

    function googleLogin(){
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider).then(async(result) => {
           console.log(result); 
        });
    }
    
  return (
    <div className="flex space-x-3 w-full">
            <Button onClick={googleLogin} variant="outline" className="w-full">
              <img src="google.png" className="mr-2 h-4 w-4" />
              Sign in with Google
            </Button>
          </div>
  )
}

export default GoogleOauth