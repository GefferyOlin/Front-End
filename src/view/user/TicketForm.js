import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  getToken,
  getUser,
  setToken,
  setUser
} from '../../features/user/userSlice';

import { Button, Form, Row, Col, Table, InputGroup } from 'react-bootstrap';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

import { createTicket, getBuildingNotes, getTicketCategories } from '../../service/ManagerService';

import { info, warning } from '../helper/snack';

import * as yup from 'yup';
import { Formik } from 'formik';
import { BuildingSelectorModal } from './modal/BuildingSelectorModal';
import { TicketSubmitModal } from './modal/TicketSubmitModal';
import { NotifySuperModal } from './modal/NotifySuperModal';


const phoneRegExp = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im
const schema = yup.object().shape({
  ticket_category: yup.string().required(),
  name: yup.string().required(),
  unit_number: yup.string().required(),
  cell_phone: yup.string().matches(phoneRegExp, 'Phone number is not valid'),
  resident_email: yup.string().email().required(),
  resident_email2: yup.string().oneOf([yup.ref('resident_email'), null], 'Emails must match.'),
  description: '',
  receive_note: false,
  terms: yup.bool().required().oneOf([true, 1, 'checked'], 'Terms must be accepted'),
});


export function TicketForm() {

  let { building_id } = useParams();

  const dispatch = useDispatch();
  const token = useSelector(getToken);
  const user = useSelector(getUser);
  const navigate = useNavigate();

  const [reviewed, setReviewed] = useState(0);
  const [buildingNotes, setBuildingNotes] = useState([]);
  const [ticketCategories, setTicketCategories] = useState([]);
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [curBuilding, setCurBuilding] = useState({});
  const [attachment1, setAttachment1] = useState(null);
  const [attachment2, setAttachment2] = useState(null);

  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticket, setTicket] = useState({});

  const onCloesTicketModal = () => {
    setShowTicketModal(false);
  }

  const onCreate = (values, resetForm) => {
    if (!curBuilding.building_id) {
      confirmAlert({
        title: 'Alert',
        message: 'Please select the building first.',
        buttons: [
          {
            label: 'Ok',
            onClick: () => { }
          }
        ]
      });
      return;
    }

    values['building_id'] = curBuilding.building_id;

    createTicket(token, user ? user.permission : '', values, attachment1, attachment2).then(response => {
      const { type, message } = response.data;

      if (type == 'S_OK') {
        setCurBuilding({});
        resetForm();

        if (document.getElementById("attachment1"))
          document.getElementById("attachment1").value = '';

        if (document.getElementById("attachment2"))
          document.getElementById("attachment2").value = '';

        setReviewed(0);
        setBuildingNotes([]);

        if (!token) {
          console.log(response.data.ticket);
          setTicket(response.data.ticket);
          setShowTicketModal(true);
        }
      } else {
        warning(message);
      }
    }).catch((error) => {
      console.log(error)
      const { status, data } = error.response;
      if (status == 401) {
        dispatch(setToken(null));
        dispatch(setUser(null));
      } else {
        warning(data.message);
      }
    });
  }

  const selectBuilding = (building) => {
    setShowBuildingModal(false);
    setCurBuilding(building);

    getBuildingNotes(building.building_id).then(response => {
      const { type, notes } = response.data;
      setBuildingNotes(notes);
    });
  }

  const onShowBuildingModal = () => {
    setShowBuildingModal(true);
  }

  const onCloesModal = () => {
    setShowBuildingModal(false);
  }

  useEffect(() => {
    getTicketCategories(token, user ? user.permission : null).then(response => {
      const { type, categories } = response.data;
      setTicketCategories(categories);
    }).catch((error) => {
      const { status, data } = error.response;
      if (status == 401) {
        dispatch(setToken(null));
        dispatch(setUser(null));
      } else {
        warning(data.message);
      }
    });
  }, []);

  return (
    <div className="tw-container tw-mx-auto">
      <div className="tw-m-3 tw-p-3 tw-rounded-lg tw-bg-green-100">
        <div className="tw-text-center tw-p-5">
          {(reviewed == 1 && curBuilding.building_id > 0) && (<span className="tw-text-xl">New Ticket Form</span>)}
          {(reviewed == 0 && curBuilding.building_id > 0) && (
            <span className="tw-text-xl">
              Please review existing global building notices below.<br />
              If your issue hasn't already been recently reported, <br />
              please click on the <span className="tw-font-bold">"continue"</span> button below to proceed
            </span>)}
        </div>

        <Formik
          validationSchema={schema}
          onSubmit={(values, { setSubmitting, resetForm }) => {
            onCreate(values, resetForm);
          }}
          initialValues={{
            ticket_category: '',
            name: '',
            unit_number: '',
            buildingStreet: '',
            residential_status: '',
            cell_phone: '',
            resident_email: '',
            resident_email2: '',
            description: '',
            receive_note: false,
            terms: true,
            attachment1: '',
            attachment2: ''
          }}
        >
          {({
            handleSubmit,
            handleChange,
            handleBlur,
            values,
            touched,
            isValid,
            errors,
          }) => (
            <Form noValidate onSubmit={handleSubmit} autoComplete="off">
              <div className="ticket-form">
                <Row>
                  <Col md={12}>
                    <div className="tw-rounded-md tw-mb-2">
                      {!curBuilding.building_id && (
                        <>
                          <div className="tw-text-center tw-italic tw-text-gray-500">Click on the Select Building button below to get started.</div>
                          <div className="tw-flex tw-flex-row tw-justify-center">
                            <Button onClick={onShowBuildingModal}>Select A Building</Button>
                          </div>
                        </>
                      )}
                      {!reviewed && curBuilding.building_id > 0 && buildingNotes.length > 0 && (
                        <>
                          {
                            buildingNotes.map((note, idx) => (<div>
                              <div key={idx} className="tw-rounded-md tw-bg-white tw-p-2">
                                <div>Create Date: {note.create_date}</div>
                                <div>Description</div>
                                <div className="tw-bg-gray-200 tw-p-1" dangerouslySetInnerHTML={{ __html: note.description }}></div>
                              </div>
                            </div>))
                          }
                          <div className="tw-mt-2 tw-text-right">
                            <Button onClick={() => setReviewed(1)}>Continue</Button>
                          </div>
                        </>
                      )}
                      {!reviewed && curBuilding.building_id > 0 && buildingNotes.length == 0 && (
                        <>
                          <div className="tw-rounded-md tw-bg-white tw-p-2 tw-text-center tw-italic tw-text-gray-400">
                            No Building Note.
                          </div>
                          <div className="tw-mt-2 tw-text-right">
                            <Button onClick={() => setReviewed(1)}>Continue</Button>
                          </div>
                        </>
                      )}
                      {/*reviewed == 1 && curBuilding.building_id && (
                          <>
                            <div className="tw-font-medium">
                              Building Info
                            </div>
                            <div className="info-inline">
                              <div>Building ID</div>
                              <div>{curBuilding.building_id}</div>
                            </div>
                            <div className="info-inline">
                              <div>Building Name</div>
                              <div>{curBuilding.name}</div>
                            </div>
                            <div className="info-inline">
                              <div>Manager's Name</div>
                              <div>{curBuilding.managers_name}</div>
                            </div>
                            <div className="info-inline">
                              <div>Manager's Email</div>
                              <div>{curBuilding.managers_email}</div>
                            </div>
                            <div className="info-inline">
                              <div>Code</div>
                              <div>{curBuilding.code}</div>
                            </div>
                            <div className="info-inline">
                              <div>Address</div>
                              <div>{curBuilding.address}</div>
                            </div>
                            <div className="info-inline">
                              <div>City</div>
                              <div>{curBuilding.city}</div>
                            </div>
                            <div className="info-inline">
                              <div>State</div>
                              <div>{curBuilding.state}</div>
                            </div>
                          </>
                        )*/}
                    </div>
                  </Col>
                  {reviewed == 1 && curBuilding.building_id && (
                    <>
                      <Col sm={12}>
                        <div className="tw-text-center tw-italic tw-text-gray-500">
                          Please complete the fields below to submit your ticket
                        </div>
                      </Col>
                      <Col md={12}>
                        <Form.Group className="mb-3" controlId="state">
                          <Form.Label>Ticket Category</Form.Label>
                          <Form.Select aria-label="" name="ticket_category" isInvalid={!!errors.ticket_category} onChange={handleChange}>
                            <option value=""></option>
                            {ticketCategories.map((tc, idx) => { return (<option key={idx} value={tc.ticket_category_id}>{tc.name}</option>) })}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group className="mb-3" controlId="name">
                          <Form.Label>Your Name<span className="tw-text-red-500">*</span></Form.Label>
                          <Form.Control type="text" name="name" isInvalid={!!errors.name} value={values.name} onChange={handleChange} />
                          <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group className="mb-3" controlId="address">
                          <Form.Label>Apartment #<span className="tw-text-red-500">*</span></Form.Label>
                          <Form.Control type="text" name="unit_number" isInvalid={!!errors.unit_number} value={values.unit_number} onChange={handleChange} />
                          <Form.Control.Feedback type="invalid">{errors.unit_number}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group className="mb-3" controlId="buildingStreet">
                          <Form.Label>Building Street #<span className="tw-text-red-500">*</span></Form.Label>
                          <Form.Control type="text" name="buildingStreet" isInvalid={!!errors.buildingStreet} value={values.buildingStreet} onChange={handleChange} />
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group className="mb-3" controlId="residential_status">
                          <Form.Label>Residential Status</Form.Label>
                          <Form.Select aria-label="" name="residential_status" isInvalid={!!errors.residential_status} onChange={handleChange}>
                            <option value=""></option>
                            <option value="Owner">Owner</option>
                            <option value="Renter">Renter</option>
                            <option value="Other">Other</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group className="mb-3" controlId="cell_phone">
                          <Form.Label>Cell Phone</Form.Label>
                          <Form.Control type="text" name="cell_phone" isInvalid={!!errors.cell_phone} value={values.cell_phone} onChange={handleChange} />
                          <Form.Control.Feedback type="invalid">{errors.cell_phone}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group className="mb-3" controlId="resident_email">
                          <Form.Label>Your Email</Form.Label>
                          <Form.Control type="text" name="resident_email" isInvalid={!!errors.resident_email} value={values.resident_email} onChange={handleChange} />
                          <Form.Control.Feedback type="invalid">{errors.resident_email}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group className="mb-3" controlId="resident_email">
                          <Form.Label>Confirm Email</Form.Label>
                          <Form.Control type="text" name="resident_email2" isInvalid={!!errors.resident_email2} value={values.resident_email2} onChange={handleChange} />
                          <Form.Control.Feedback type="invalid">{errors.resident_email2}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group className="mb-3" controlId="description">
                          <Form.Label>Description</Form.Label>
                          <Form.Control as="textarea" name="description" value={values.description} onChange={handleChange} />
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group className="mb-3" controlId="receive_note">
                          <Form.Check
                            name="receive_note"
                            label="Send New Ticket Email Alerts"
                            onChange={handleChange}
                            defaultChecked={values.receive_note}
                            isInvalid={!!errors.receive_note}
                            feedback={errors.receive_note}
                            feedbackType="invalid"
                            id="validationFormik0"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group controlId="attachment1" className="mb-3">
                          <Form.Label>Attachment 1</Form.Label>
                          <Form.Control type="file" name="attachment1" onChange={(evt) => setAttachment1(evt.target.files[0])} />
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group controlId="attachment2" className="mb-3">
                          <Form.Label>Attachment 2</Form.Label>
                          <Form.Control type="file" name="attachment2" onChange={(evt) => setAttachment2(evt.target.files[0])} />
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <div className="tw-flex tw-flex-column tw-justify-end">
                          <Form.Group className="tw-mb-3 tw-mr-3" controlId="terms">
                            <Form.Check
                              required
                              name="terms"
                              label={(<>I've read and agree with the <Link to="/terms" target="_blank">terms and conditions</Link></>)}
                              onChange={handleChange}
                              defaultChecked={values.terms}
                              isInvalid={!!errors.terms}
                              feedback={errors.terms}
                              feedbackType="invalid"
                              id="validationFormik1"
                            />
                          </Form.Group>
                        </div>
                        <div className="tw-flex tw-flex-column tw-justify-end">
                          <Button type="submit"><i className="fas fa-save"></i>&nbsp; Submit</Button>
                        </div>
                      </Col>
                    </>
                  )}
                </Row>
              </div>
            </Form>
          )}
        </Formik>
      </div >
      <TicketSubmitModal shown={showTicketModal} handleClose={onCloesTicketModal} ticket={ticket} />
      <BuildingSelectorModal show={showBuildingModal} handleClose={onCloesModal} selectBuilding={selectBuilding} />
    </div >
  );
}
