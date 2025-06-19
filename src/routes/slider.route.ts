import { Router } from "express";
import { addSlider, deleteSlider, getAllSliders } from '../controllers/slider.controller'
import adminAuth from '../middleware/auth.admin.middleware'
import { upload } from "../middleware/multer.middleware";
const route = Router();

route.post('/add',upload.single('image'),adminAuth,addSlider)
route.get('/see',getAllSliders)
route.delete('/:sliderId/delete',adminAuth,deleteSlider)

export default route;