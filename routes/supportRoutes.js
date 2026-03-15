const express = require("express");
const router = express.Router();
const supportController = require("../controller/supportController");

router.post("/tickets", supportController.createTicket);
router.get("/tickets", supportController.getTickets);
router.get("/tickets/:id", supportController.getTicket);
router.put("/tickets/:id", supportController.updateStatus);
router.delete("/tickets/:id", supportController.deleteTicket);

module.exports = router;