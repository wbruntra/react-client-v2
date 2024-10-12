import React from 'react'
import Modal from 'react-bootstrap/Modal'

const SetModal = ({ children, visible: popupVisible }) => {
  return (
    <>
      <Modal show={popupVisible}>
        <Modal.Header>
          <Modal.Title>Submitting action...</Modal.Title>
        </Modal.Header>
        <Modal.Body>{children}</Modal.Body>
        <Modal.Footer></Modal.Footer>
      </Modal>
    </>
  )

  return (
    <div className={`modal popup-message ${popupVisible ? 'show' : ''}`}>
      <div className="modal-content">{children}</div>
    </div>
  )
}

export default SetModal
