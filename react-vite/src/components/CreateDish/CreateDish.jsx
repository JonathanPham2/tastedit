import { useState, useEffect, useRef} from "react"
import "./CreateDish.css"
import { FaStar } from "react-icons/fa"
import { CSSTransition } from "react-transition-group"
import beefIcon from "../../../dist/beef.png"
import fishIcon from "../../../dist/fish.png"
import chickenIcon from "../../../dist/chicken.png"
import lambIcon from "../../../dist/lamb.png"
import porkIcon from "../../../dist/pork.png"
import plantedBaseIcon from "../../../dist/planted.png"
import logo from "../../../dist/favicon.ico"
import { thunkPostDish } from "../../redux/dishes"
import { useDispatch, useSelector } from "react-redux"
import { ToastContainer,  toast, cssTransition} from "react-toastify"
import { selectorRestaurantsArray, thunkFetchRestaurant } from "../../redux/restaurants"
import { useNavigate } from "react-router-dom"
import LoadingScreen from "../LoadingScreen"




// initialize proteins so we can map and display it
const proteins = [
    {name: "Beef", icon: beefIcon},
    {name: "Fish", icon: fishIcon},
    {name: "Chicken", icon:chickenIcon},
    {name: "Lamb", icon: lambIcon},
    {name: "Pork", icon: porkIcon},
    {name: "Planted-base", icon: "/planted.png"},

]


const CreateDish = () => {
    const [stage, setStage] = useState(1)
    const [vegan, setVegan] = useState(false)
    const [dishName, setDishName]  = useState("")
    const [protein, setProtein] = useState("")
    const [cuisine, setCuisine] = useState("")
    const [description, setDescription] = useState("")
    const [recommended, setRecommended] = useState(null)
    const [price, setPrice] = useState("")
    const [starRating, setStarRating] = useState(0)
    const [starHover, setStarHover] = useState(0)
    const [imageUrl, setImageUrl] = useState(null)
    const [file, setFile] = useState(null)
    const [spicyLevel, setSpicyLevel] = useState("no spice")
    const [restaurant, setRestaurant] = useState(null)
    const [transitionStage, setTransitionStage] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const nodeRef = useRef(null)
    const dispatch = useDispatch()
    const restaurants = useSelector(selectorRestaurantsArray)
    const navigate = useNavigate()
    


    // -----------------------------------
    // this useEffect for checking if vegan true we will render all the proteins if false we will only render planted base for now
    useEffect(()=> {
        if(vegan){
            setProtein("Planted-base")
        }
        else {
            setProtein("")
        }
    },[vegan])
    // fetch restaurant
    useEffect(() => {
        dispatch(thunkFetchRestaurant())
    },[])
 
    const progressPercent = ((stage - 1) / (4 -1)) *100 // stage - 1 because we want the progress bar at 0% when we at first stage
    // (4-1) 4 is the total stages that we have and 4-1 is because even though we have 4 stages but only 3 tranistions
    // then lastly we multiply 100 to get the percentage

    // for transition when stage change 
    useEffect(() => {
        const timer = setTimeout(() => {
            setTransitionStage(stage);
        }, 500);

        return () => clearTimeout(timer);
    }, [stage]);

    // generate thumbnail
    const fileWrap = (e) => {
        e.stopPropagation();
        console.log("files",e.target.files)
    
        const tempFile = e.target.files[0];
    
        // Check for max image size of 5Mb
        if (tempFile.size > 5000000) {
            toast.error("File size should be less than 5MB")
        
          return
        }
    
        const newImageURL = URL.createObjectURL(tempFile); 
        setImageUrl(newImageURL);
        setFile(tempFile);
        
      }


    // function will handle star rating
    const starRender = () => {
        let stars = [];
        for(let i = 1; i <= 5; i++){
            stars.push(
                <FaStar 
                key={i}
                className={i <= (starHover || starRating) ? "filled-star": "empty-star"}
                onMouseEnter={() => setStarHover(i)} // this part for hovering
                onMouseLeave={() => setStarHover(0)} // also for hovering
                onClick={() => {
                    if(starRating === i){
                        setStarRating(currentStage => currentStage -1)
                    }
                    else {
                        setStarRating(i)
                    }

                }}
                />
            )
        }
        return stars

    }



    const validateCurrentStage = () => {
        switch (stage) {
            case 1:
                return vegan !== undefined;
            case 2:
                return dishName.trim() !== "" && (vegan || protein !== "") && cuisine !== "" && spicyLevel !== "";
            case 3:
                return description.trim() !== "" && recommended !== null && starRating !== 0;
            case 4:
                return file !== null;
            default:
                return false;
        }
    };
    // handle next button
    const handleNext = () => {
        console.log("Current Stage before increment:", stage);
        if(validateCurrentStage() ){
            
            setStage(currentStage => {
                console.log("Updating stage from", currentStage, "to", currentStage + 1);
                
                   return currentStage +1
                
            })
        }

    }

    // handle protein click
    const handleProteinClick = (proteinName) => {
        setProtein(proteinName);
    
    }

    let timerId = null

    const swirl = cssTransition({
        enter: "fade-in",
        exit: "fade-out"
      });


    const handleSubmit = (e) => {
        e.preventDefault();
        clearTimeout(timerId)
        if(!validateCurrentStage()){
            toast.error("Please fill all the required fields")
            return
        }

        setIsLoading(true)

        // initialize form data
        const formData = new FormData();

        formData.append("name", dishName)
        formData.append("restaurant_id", restaurant.id)
        formData.append("vegan", vegan)
        formData.append("spicy_level", spicyLevel)
        formData.append("cuisine", cuisine)
        formData.append("protein_type", protein)
        formData.append("description", description)
        formData.append("price", price)
        formData.append("recommended", recommended)
        formData.append("rating", starRating)
        formData.append("images", file)

    
        

        dispatch(thunkPostDish(formData)).then(newDish => {
            console.log("----------------------",newDish)
        timerId = setTimeout(()=> {
                setIsLoading(false)
                if(newDish.id) {
                    toast.dark("Successfully Uploaded", {
                        onClose:() => navigate("/"),
                        transition: swirl

                    }
                )
                }
                else {
                    toast.dark(`${newDish.statusText}`,{
                        transition:swirl
                    })
                }



            },1000)
            // if(newDish) {
            //     toast.success("Successfully Uploaded", {
            //         onClose:() => navigate("/")
            //     })
            //    }
            
        }).catch(error => {
            setIsLoading(false);
            toast.error("Error posting dish")
        })
    }



const stageContent = () => {
    switch (transitionStage) {
        case 1:
            return (
                <section  className={`vegan-section`}>
                        <h2>Is this a vegan dish?</h2>
                        <div className="vegan-button">
                        <button className="button-yes" onClick={() => {
                            setVegan(true)
                            setStage(2)
                            }}>Yes</button>
                        <button className="button-yes" onClick={() => {
                            
                            setStage(2)
                            setVegan(false)
                            
                            }}>No</button>
                        </div>
                    

                    </section>

            )
        case 2:
            return (
                <section  className={`name-protein`}>
                        {/* <h2>What is the name of your dish ?</h2> */}
                        <div className="dish-name-container">
                        <input 
                        className="dish-name"
                        required
                        value={dishName} onChange={(e) => setDishName(e.target.value)} id="dish_name" type="text" />
                        <div className="floating-dish-name" style={dishName ? {top: "39%", color: "#ffc107", text_shadow: "2px 2px 20px rgba(0,0, 0, 0.8)"}: null}><label>What is the name of your dish?</label></div>
                        </div>
                        <h2>Select the protein type:</h2>
                        
                        <div className="protein-grid">
                            {vegan === false ? proteins.map(({name, icon})=> (
                                <button key={name}
                                className={`protein-button ${protein === name ? "selected" : ""}`}
                                onClick={() => handleProteinClick(name)}>
                                    <img src={icon} alt={name} className="protein-icon" />
                                    <span>{name}</span>
                                </button>
                                
                    

                            )): <button key={proteins[5].name} className={`protein-button ${protein === proteins[5].name ? "selected": null}` } onClick={() => handleProteinClick(proteins[5].name)}>
                                    <img src={proteins[5].icon} alt={proteins[5].name} className="protein-icon"/>
                                </button>}
                        </div>
                        
                        {/* <h2>What cuisine is your dish ?</h2> */}
                        <div className="cuisine-text-container">
                        <input className="cuisine-text" type="text"
                            id="cuisine"
                            name="cuisine"
                            value={cuisine}
                            onChange={(e) => setCuisine(e.target.value)}
                         /><div className="floating-cuisine" style={cuisine ? {top: "40%", color: "#ffc107", text_shadow: "2px 2px 20px rgba(0,0, 0, 0.8)"}: null}><label>What cuisine is your dish ?</label></div>
                         </div>
                         <h2>Choose the spicy level</h2>
                        <select onChange={(e) => setSpicyLevel(e.target.value)} value={spicyLevel} name="spicy_level" id="spicy_level">
                            <option value="no spice">No Spice</option>
                            <option value="mild">Mild</option><option value="medium">Medium</option>
                            <option value="very spicy">Very Spicy</option>
                        </select>
                        <div className="restaurants-buttons-container">
                            <button className="restaurant-button-dropdown">{ !restaurant ? `Choose your restaurant` : restaurant.name}</button>
                            <div className="restaurant-content">
                        {restaurants?.map(restaurant => (
                            <button onClick={() => setRestaurant(restaurant)} key={restaurant.id}>{restaurant.name}</button>

                        ))}
                        </div>

                        </div>

                        
        
                    </section>

            );
        case 3:
            return (
                <section key="stage3" className={`last-section`}>
                <h2>What's in your dish? Tell us about it!</h2>
                <textarea onChange={(e) => setDescription(e.target.value)} id="description" type="text" value={description} />
                <div className="dropdown">
                    <button className="drop-button">Choose the price </button>
                    <div className="dropdown-content">
                    <button onClick={() => setPrice('Budget-friendly')}>Budget-friendly</button>
                    <button onClick={() => setPrice('Moderate')}>Moderate</button>
                    <button onClick={() => setPrice('Expensive')}>Expensive</button>
                        
                    </div>
                </div>

                <h2>Would you recommend this dish to others?</h2>
                    <div className="stage-3-button-container">
                        <button className="button-yes" onClick={() => setRecommended(true)}>Yes</button>
                        <button className="button-no" onClick={() => setRecommended(false)}>No</button>
                    </div>
                <h2>How many stars would you give your dish</h2>
                <div className="stars-container">{starRender()} Stars</div>
                
            </section>
           
            );

        case 4:
            return (
                <section key="stage4" className="upload-image">
                        <h2>Add some photos of your dish</h2>
                        <div className="file-inputs-container">
                            <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={fileWrap}/>
                            <label htmlFor="post-image-input" className="file-input-labels-noname"><img src={imageUrl} className="thumbnails-noname"></img></label>
                        </div>
                        

                    </section>
                   

            )
        default:
            return null
    
        
    }
}
console.log("restaurant id ----------------", isLoading)

    return (
        <main className="create-form-container">

             <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover bodyClassName={"toast-me"}/>
            <div className="util-container">
                <a href="/"><img className="logo-image" src={logo} alt="logo" /></a>
                <button>Save and Exit</button>
            </div>
            {isLoading && <LoadingScreen/>}

            
             <CSSTransition
                in={transitionStage === stage}
                timeout={500}
                classNames="section-transition"
                unmountOnExit
                nodeRef={nodeRef}
             >
                <div ref={nodeRef}>
                    {stageContent()}
                </div>

             </CSSTransition>
        

                {/* {stage === 1 && (
                    <section className={`vegan-section ${stage === 1 ? "section" : "hidden"}`}>
                        <h2>Is this a vegan dish?</h2>
                        <div className="vegan-button">
                        <button className="button-yes" onClick={() => {
                            setVegan(true)
                            setStage(2)}}>Yes</button>
                        <button className="button-yes" onClick={() => setStage(2)}>No</button>
                        </div>
                    

                    </section>
                   

                )}
                 */}


                
                {/* {stage === 2 &&(
                    <section className={`name-protein  ${stage === 2 ? "section" : "hidden"} `}>
                       
                        <input 
                        className="dish-name"
                        required
                        value={dishName} onChange={(e) => setDishName(e.target.value)} id="dish_name" type="text" />
                        <div className="floating-dish-name" style={dishName ? {top: "50.5px", color: "#ffc107", text_shadow: "2px 2px 20px rgba(0,0, 0, 0.8)"}: null}><label>What is the name of your dish?</label></div>
                        <h2>Select the protein type:</h2>
                        <div className="protein-grid">
                            {proteins.map(({name, icon})=> (
                                <button key={name}
                                className={`protein-button ${protein === name ? "selected" : ""}`}
                                onClick={() => handleProteinClick(name)}>
                                    <img src={icon} alt={name} className="protein-icon" />
                                    <span>{name}</span>
                                </button>
                    

                            ))}
                        </div>
                       
                        <input className="cuisine-text" type="text"
                            id="cuisine"
                            name="cuisine"
                            value={cuisine}
                            onChange={(e) => setCuisine(e.target.value)}
                         /><div className="floating-cuisine" style={cuisine ? {top: "519px", color: "#ffc107", text_shadow: "2px 2px 20px rgba(0,0, 0, 0.8)"}: null}><label>What cuisine is your dish ?</label></div>
                         <h2>Choose the spicy level</h2>
                        <select onChange={(e) => setSpicyLevel(e.target.value)} value={spicyLevel} name="spicy_level" id="spicy_level">
                            <option value="no spice">No Spice</option>
                            <option value="mild">Mild</option><option value="medium">Medium</option>
                            <option value="very spicy">Very Spicy</option>
                        </select>
                        <button onClick={handleNext}>Next</button>
                        
        
                    </section>
                    
                )}
            */}
                {/* {stage === 3 &&(
                   
                    <section className={`last-section  ${stage === 3 ? "section" : "hidden"} `}>
                        <h2>What's in your dish? Tell us about it!</h2>
                        <textarea onChange={(e) => setDescription(e.target.value)} id="description" type="text" value={description} />

                        <h2>Would you recommend this dish to others?</h2>
                            <div className="stage-3-button-container">
                                <button className="button-yes" onClick={() => setRecommended(true)}>Yes</button>
                                <button className="button-no" onClick={() => setRecommended(false)}>No</button>
                            </div>
                        <h2>How many stars would you give your dish</h2>
                        <div className="stars-container">{starRender()} Stars</div>
                        <button onClick={() => setStage(currentStage => currentStage - 1)}>Back</button>
                    </section>
                   
                )} 
                {stage === 4 && (
                  
                    <section className="upload-image">
                        <h2>Add some photos of your dish</h2>
                        <div className="file-inputs-container">
                            <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={fileWrap}/>
                            <label htmlFor="post-image-input" className="file-input-labels-noname"><img src={imageUrl} className="thumbnails-noname"></img></label>
                        </div>
                        

                    </section>
                   
                )} */}

                <div className="progress-bar-container">
                    <div className="progress-bar" style={{width: `${progressPercent}%`}}></div>
                </div>
                

                {stage >1 && stage < 4 &&<div className="back-next-button">
                            <button onClick={() => setStage(currentStage => currentStage - 1)}>Back</button>
                            <button onClick={handleNext}>Next</button>
                        </div>}
                
                {stage === 4 &&  (
                    <div>
                        <button onClick={() => setStage(currentStage => currentStage - 1)}>Back</button>
                        
                        <button className="post-dish" disabled={!validateCurrentStage()} onClick={handleSubmit}>
                        POST
                        </button>
                    </div>
                )}
                    
        
        </main>

    )
}


export default CreateDish