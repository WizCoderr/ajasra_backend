import { Router } from "express";
import { addSlider, deleteSlider, getAllSliders } from '../controllers/slider.controller'
import adminAuth from '../middleware/auth.admin.middleware'
const route = Router();

route.post('/add',adminAuth,addSlider)
route.get('/see',adminAuth,getAllSliders)
route.delete('/delete',adminAuth,deleteSlider)

export default route;