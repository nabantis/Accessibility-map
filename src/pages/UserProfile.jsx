import React, {useState, useEffect} from "react";
import {supabase} from '../lib/supabase';
import {useNavigate} from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext';
import './Map.css';

// toggle button for user needs
function ToggleButton({name, userNeed, setUserNeed}) {

    const handleClick = () => {
        setUserNeed(!userNeed);
    }
    
    return (
    <div style={{
        borderTop: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '12px',
        paddingBottom: '12px',
        color: 'var(--text)'
    }}>
        <div style={{fontWeight: '500'}}>{name}</div>
        <div
            role="switch"
            aria-checked={userNeed}
            aria-label={`Toggle ${name}`}
            tabIndex={0}
            onClick={handleClick}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } }}
            style={{
                width: '44px',
                height: '24px',
                background: userNeed ? 'var(--accent)' : 'var(--border)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'background 0.3s ease',
                padding: '2px',
                boxSizing: 'border-box'
            }}>
            
            <div
            style={{
                width: '20px',
                height: '20px',
                background: '#fff',
                borderRadius: '50%',
                transform: `translateX(${userNeed ? 20 : 0}px)`,
                transition: 'transform 0.3s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }} />
        </div>
    </div>
    )
}

export default function UserProfile() {
    // for navigating to other pages
    const navigate = useNavigate()
    // authorisation 
    const {user, signOut} = useAuth()
    // user profile states
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [createdAt, setCreatedAt] = useState(false);
    const [liftAccess, setLiftAccess] = useState(false);
    const [rampAccess, setRampAccess] = useState(false);
    const [widePaths, setWidePaths] = useState(false);
    const [automaticDoors, setAutomaticDoors] = useState(false);
    const [tactilePaving, setTactilePaving] = useState(false);
    const [highContrast, setHighContrast] = useState(false);
    const [textToSpeech, setTextToSpeech] = useState(false);
    const [avoidCrowds, setAvoidCrowds] = useState(false);

    // 
    useEffect(() => {
        // check if there is an active session
        if (user) {
            if (user.user_metadata?.full_name) {
                setName(user.user_metadata.full_name)
            }

            getUserNeeds(user.id)
        } else {
            // shouldn't need to do anything here because of protected route
        }
        
    }, [user]) // [] means runs once when component loads

    // fetch from supabase
    const getUserNeeds = async (userIdToFetch) => {

         if (!userIdToFetch) {
             console.error("user id error")
             return
         }

         const {data, error} = await supabase
             .from('accessibility_preferences') 
             .select('*')
             .eq('user_id', userIdToFetch)
             .maybeSingle()
             
        if (error) {
            console.error("error!", error)
            return
        }

           if (data) {
               setEmail(data.email)
               setCreatedAt(data.created_at)  
               setLiftAccess(data.lift_access)
               setRampAccess(data.ramp_access)
               setWidePaths(data.wide_paths)
               setAutomaticDoors(data.automatic_door)
               setTactilePaving(data.tactile_paving)
               setHighContrast(data.high_contrast)
               setTextToSpeech(data.text_to_speech)
               setAvoidCrowds(data.crowded_areas)
               // Persist high contrast to localStorage
               localStorage.setItem('highContrast', data.high_contrast ? 'true' : 'false');
               window.dispatchEvent(new Event('highContrastChanged'));
           }
    }

    const setUserNeeds = async () => {
        if (!user) return;

        const {data, error} = await supabase
            .from('accessibility_preferences')
            .upsert({
                user_id: user.id,
                lift_access: liftAccess,
                ramp_access: rampAccess,
                wide_paths: widePaths,
                automatic_door: automaticDoors,
                tactile_paving: tactilePaving,
                high_contrast: highContrast,
                text_to_speech: textToSpeech,
                crowded_areas: avoidCrowds
            }, { onConflict: 'user_id' })
            .select()

        // Persist high contrast to localStorage
        localStorage.setItem('highContrast', highContrast ? 'true' : 'false');
        window.dispatchEvent(new Event('highContrastChanged'));

        if (error) {
            console.error("error!", error)
        } else {
            alert("User needs updated")
        }
    }




        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                    height: '100%',
                    padding: '20px',
                    background: 'var(--bg)',
                    color: 'var(--text)'
                }}
            >
                <div
                    style={{
                        padding: '40px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '15px',
                        width: '100%',
                        maxWidth: '400px',
                        background: 'var(--surface)',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                        color: 'var(--text)'
                    }}
                >
                    <h2 style={{ textAlign: 'center', margin: 0, color: 'var(--text)' }}>User Profile</h2>
                <h4 style={{textAlign: 'center', margin: 0, fontWeight: 'normal', color: 'var(--muted)'}}>Welcome {name}!</h4>
                
                <h5 style={{margin: 0, marginTop: '10px', textAlign: 'center', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Accessibility Preferences</h5> 
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '0'}}>
                <ToggleButton name={"Lift access"} userNeed={liftAccess} setUserNeed={setLiftAccess}/>
                <ToggleButton name={"Ramp access"}userNeed={rampAccess} setUserNeed={setRampAccess}/>
                <ToggleButton name={"Wide path"} userNeed={widePaths} setUserNeed={setWidePaths}/>
                <ToggleButton name={"Tactile paving"} userNeed={tactilePaving} setUserNeed={setTactilePaving}/>
                <ToggleButton name={"Automatic doors"} userNeed={automaticDoors} setUserNeed={setAutomaticDoors}/>
                <ToggleButton name={"High contrast"} userNeed={highContrast} setUserNeed={setHighContrast}/>
            </div>


            <button 
                onClick={setUserNeeds}
                style={{
                    padding: '12px',
                    borderRadius: 'var(--radius)',
                    background: 'var(--green)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    marginTop: '10px',
                    fontWeight: 'bold',
                    fontSize: '1em'
                }}
            >Save preferences</button>


            </div>
        </div>
    )
}