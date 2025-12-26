import { Router } from "express";
import { login, register, addToHistory,getUserHistory} from "../controllers/usercontroller.js";
const router = Router();


// Everything for /login stays in one block:
// Reduces repeated typing of the same route

router
    .route("/login")
    .post(login);

router
    .route("/register")
    .post(register);

router.route("/add_to_activity").post(addToHistory);
router.route("/get_all_activity").get(getUserHistory);

export default router;
