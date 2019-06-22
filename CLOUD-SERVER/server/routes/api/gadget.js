const router = require('express').Router();
const pool = require('./../../../database/db');
const { on, off } = require('./../../socket/socket');

router.post('/', async (req, res) => {
  try {
    const {
      rpi_id,
      gadget_type_id,
      gadget_name,
      gpio_number,
      power
    } = req.body;

    await pool.query(
      `
      INSERT INTO gadget (rpi_id,gadget_type_id, gadget_name, gpio_number, power)
          VALUES ('${rpi_id}','${gadget_type_id}','${gadget_name}','${gpio_number}','${power}');
      `
    );
    res.json({
      message: 'Gadget added to user successfully'
    });
  } catch (err) {
    res.status(400).send(err);
  }
});

// Get All The Gadgets Of The User
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;

    // Get id from username
    const { user_id } = (await pool.query(
      `
      SELECT user_id FROM users
        WHERE username='${username}'
      `
    )).rows[0];

    const data = (await pool.query(
      `
      SELECT gadget_id, gadget_name, gpio_number, status
        FROM gadget NATURAL JOIN raspberry_pi
        WHERE user_id='${user_id}'
      `
    )).rows;
    res.json({ data });
  } catch (err) {
    res.send(err);
  }
});

// Authenticated User Can Call This Route
router.post('/on', async (req, res) => {
  try {
    const { rpi_id, gadget_id } = req.body;
    // Get socket id for the corresponding pi
    const raspberryInfo = (await pool.query(
      `
      SELECT rpi_id, socket_id FROM raspberry_pi
        WHERE rpi_id='${rpi_id}'
      `
    )).rows[0];

    const { socket_id } = raspberryInfo;
    const gadgetInfo = (await pool.query(
      `
      SELECT gpio_number, power, status FROM gadget
        WHERE gadget_id='${gadget_id}'
      `
    )).rows[0];

    if (gadgetInfo.status) {
      throw { statusId: 400, message: 'Device is already turned on' };
    }
    await pool.query(
      `
      UPDATE gadget
        SET status=${true}
        WHERE gadget_id='${gadget_id}'
      `
    );
    // TODO
    // Start a session for that gadget

    data = {
      gpio: gadgetInfo.gpio_number
    };
    on(socket_id, data);

    res.json({
      msg: 'Device is turned on'
    });
  } catch (err) {
    res.status(err.statusId || 400).json({ message: err.message || err });
  }
});

// Authenticated User Can Call This Route
router.post('/off', async (req, res) => {
  try {
    const { rpi_id, gadget_id } = req.body;
    // Get socket id for the corresponding pi
    const raspberryInfo = (await pool.query(
      `
      SELECT rpi_id, socket_id FROM raspberry_pi
        WHERE rpi_id='${rpi_id}'
      `
    )).rows[0];

    const { socket_id } = raspberryInfo;
    const gadgetInfo = (await pool.query(
      `
      SELECT gpio_number, power, status FROM gadget
        WHERE gadget_id='${gadget_id}'
      `
    )).rows[0];
    console.log('Socket Id', socket_id);
    console.log('GadgetInfo');
    console.log(gadgetInfo);
    if (!gadgetInfo.status) {
      throw { statusId: 400, message: 'Device is already off' };
    }
    await pool.query(
      `
      UPDATE gadget
        SET status=${false}
        WHERE gadget_id='${gadget_id}'
      `
    );
    // TODO
    // Start a session for that gadget

    data = {
      gpio: gadgetInfo.gpio_number
    };
    off(socket_id, data);

    res.json({
      msg: 'Device is turned off'
    });
  } catch (err) {
    res.status(400).json({ message: err.message || err });
  }
});

module.exports = router;
