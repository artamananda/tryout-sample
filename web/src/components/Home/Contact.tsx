import { useState } from 'react';
// import emailjs from 'emailjs-com';
import React from 'react';
import FooterCopyright from '../Footer';

const initialState = {
  name: '',
  email: '',
  message: ''
};
export const Contact = (props: any) => {
  const [{ name, email, message }, setState] = useState(initialState);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setState((prevState) => ({ ...prevState, [name]: value }));
  };
  const clearState = () => setState({ ...initialState });

  const handleSubmit = (e: any) => {
    e.preventDefault();
    console.log(name, email, message);

    {
      /* replace below with your own Service ID, Template ID and Public Key from your EmailJS account */
    }

    // emailjs
    //   .sendForm(
    //     'YOUR_SERVICE_ID',
    //     'YOUR_TEMPLATE_ID',
    //     e.target,
    //     'YOUR_PUBLIC_KEY'
    //   )
    //   .then(
    //     (result: any) => {
    //       console.log(result.text);
    //       clearState();
    //     },
    //     (error: any) => {
    //       console.log(error.text);
    //     }
    //   );
  };
  return (
    <div>
      <div id="contact">
        <div className="container">
          <div className="section-title">
            <h2>KONTAK KAMI</h2>
          </div>
          <div className=" contact-info">
            <h3>Informasi Kontak</h3>
            <div className="contact-item">
              <p>
                <span>
                  <i className="fa fa-map-marker"></i> Alamat
                </span>
                {props.data ? props.data.address : 'loading'}
              </p>
            </div>
            <div className="contact-item">
              <p>
                <span>
                  <i className="fa fa-phone"></i> WhatsApp
                </span>{' '}
                {props.data ? props.data.phone : 'loading'}
              </p>
            </div>
            <div className="contact-item">
              <p>
                <span>
                  <i className="fa fa-envelope-o"></i> Email
                </span>{' '}
                {props.data ? props.data.email : 'loading'}
              </p>
            </div>
            <div className="contact-item">
              <p>
                <span>
                  <i className="fa fa-instagram"></i> Instagram
                </span>{' '}
                {props.data ? props.data.instagram : 'loading'}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div id="footer">
        <div className="container text-center">
          <FooterCopyright />
        </div>
      </div>
    </div>
  );
};
