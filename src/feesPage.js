/**
 * Academy Fee Submission Page Logic & Razorpay Standard Web Checkout Integration
 * Gurukul Football Academy
 */
import { initNeuralNoise } from './neural-noise.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Neural Noise Background
  try {
    initNeuralNoise();
  } catch (err) {
    console.warn('Neural noise canvas init warning:', err);
  }

  // 2. Initialize Interactive Features
  initCustomCursor();
  initMobileMenu();
  initTabs();
  initAmountCalculator();
  initRazorpayPayment();
  initReceiptModal();
});

/* --------------------------------------------------------------------------
   Custom Football Cursor Implementation
   -------------------------------------------------------------------------- */
function initCustomCursor() {
  const ball = document.getElementById('footballCursorBall');
  const ring = document.getElementById('footballCursorRing');

  if (!ball || !ring) return;

  if (window.matchMedia('(pointer: coarse)').matches) {
    ball.style.display = 'none';
    ring.style.display = 'none';
    return;
  }

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ballX = mouseX;
  let ballY = mouseY;
  let ringX = mouseX;
  let ringY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function renderCursor() {
    ballX += (mouseX - ballX) * 0.22;
    ballY += (mouseY - ballY) * 0.22;
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;

    ball.style.transform = `translate3d(${ballX - 12}px, ${ballY - 12}px, 0)`;
    ring.style.transform = `translate3d(${ringX - 22}px, ${ringY - 22}px, 0)`;

    requestAnimationFrame(renderCursor);
  }
  requestAnimationFrame(renderCursor);

  const hoverTargets = document.querySelectorAll('button, a, input, select, .preset-chip');
  hoverTargets.forEach((target) => {
    target.addEventListener('mouseenter', () => {
      ring.style.transform += ' scale(1.6)';
      ring.style.borderColor = 'rgba(56, 189, 248, 0.8)';
    });
    target.addEventListener('mouseleave', () => {
      ring.style.transform = ring.style.transform.replace(' scale(1.6)', '');
      ring.style.borderColor = 'rgba(255, 255, 255, 0.25)';
    });
  });
}

/* --------------------------------------------------------------------------
   Mobile Menu Drawer Toggle
   -------------------------------------------------------------------------- */
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobileMenuToggle');
  const navCenter = document.querySelector('.nav-center');
  const navLinks = document.querySelectorAll('.nav-glass-capsule .nav-link');

  if (!toggleBtn || !navCenter) return;

  function toggleMenu(e) {
    if (e) e.stopPropagation();
    const isActive = navCenter.classList.toggle('active');
    toggleBtn.classList.toggle('active', isActive);
  }

  function closeMenu() {
    navCenter.classList.remove('active');
    toggleBtn.classList.remove('active');
  }

  toggleBtn.addEventListener('click', toggleMenu);

  navLinks.forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('click', (e) => {
    if (!navCenter.contains(e.target) && !toggleBtn.contains(e.target)) {
      closeMenu();
    }
  });
}

/* --------------------------------------------------------------------------
   Tab Switching: Fee Submission (Active) & Merchandise (Coming Soon)
   -------------------------------------------------------------------------- */
function initTabs() {
  const feeTabBtn = document.getElementById('tabFeeSubmissionBtn');
  const merchTabBtn = document.getElementById('tabMerchandiseBtn');
  const feePane = document.getElementById('paneFeeSubmission');
  const merchPane = document.getElementById('paneMerchandise');
  const backToFeesBtn = document.getElementById('backToFeesBtn');

  if (!feeTabBtn || !merchTabBtn || !feePane || !merchPane) return;

  function switchToFee() {
    feeTabBtn.classList.add('active');
    feeTabBtn.setAttribute('aria-selected', 'true');
    merchTabBtn.classList.remove('active');
    merchTabBtn.setAttribute('aria-selected', 'false');

    feePane.classList.add('active');
    feePane.style.display = 'block';
    merchPane.classList.remove('active');
    merchPane.style.display = 'none';
  }

  function switchToMerch() {
    merchTabBtn.classList.add('active');
    merchTabBtn.setAttribute('aria-selected', 'true');
    feeTabBtn.classList.remove('active');
    feeTabBtn.setAttribute('aria-selected', 'false');

    merchPane.classList.add('active');
    merchPane.style.display = 'block';
    feePane.classList.remove('active');
    feePane.style.display = 'none';
  }

  feeTabBtn.addEventListener('click', switchToFee);
  merchTabBtn.addEventListener('click', switchToMerch);

  if (backToFeesBtn) {
    backToFeesBtn.addEventListener('click', switchToFee);
  }
}

/* --------------------------------------------------------------------------
   Amount Input & Total Display Synchronizer
   -------------------------------------------------------------------------- */
function initAmountCalculator() {
  const amountInput = document.getElementById('feeAmount');
  const feeTypeSelect = document.getElementById('feeType');
  const summaryPurpose = document.getElementById('summaryPurpose');
  const summaryTotal = document.getElementById('summaryTotal');
  const btnPayText = document.getElementById('btnPayText');

  function updateDisplay(value) {
    const numericVal = parseFloat(value) || 0;
    const formatted = numericVal.toLocaleString('en-IN');

    if (summaryTotal) {
      summaryTotal.textContent = `₹${formatted}`;
    }
    if (btnPayText) {
      btnPayText.textContent = numericVal > 0 ? `Pay ₹${formatted} with Razorpay` : 'Enter Fee Amount';
    }
  }

  const wrapper = document.querySelector('.amount-input-wrapper');
  if (wrapper && amountInput) {
    wrapper.addEventListener('click', () => amountInput.focus());
  }

  if (amountInput) {
    amountInput.addEventListener('input', (e) => {
      updateDisplay(e.target.value);
    });
    // Initial run
    updateDisplay(amountInput.value);
  }

  if (feeTypeSelect && summaryPurpose) {
    feeTypeSelect.addEventListener('change', () => {
      summaryPurpose.textContent = feeTypeSelect.options[feeTypeSelect.selectedIndex].text;
    });
  }
}

/* --------------------------------------------------------------------------
   Razorpay Standard Web Checkout Integration
   -------------------------------------------------------------------------- */
function initRazorpayPayment() {
  const form = document.getElementById('feePaymentForm');
  const payBtn = document.getElementById('payNowBtn');
  const btnSpinner = document.getElementById('btnSpinner');
  const btnContent = document.getElementById('btnContent');
  const btnPayText = document.getElementById('btnPayText');
  const alertBox = document.getElementById('paymentAlert');
  const alertIcon = document.getElementById('alertIcon');
  const alertMessage = document.getElementById('alertMessage');

  if (!form || !payBtn) return;

  function setButtonLoading(isLoading, text = 'Processing...') {
    payBtn.disabled = isLoading;
    if (isLoading) {
      btnSpinner.style.display = 'inline-block';
      btnContent.style.opacity = '0.7';
      if (btnPayText) btnPayText.textContent = text;
    } else {
      btnSpinner.style.display = 'none';
      btnContent.style.opacity = '1';
      const amountVal = parseFloat(document.getElementById('feeAmount')?.value) || 0;
      if (btnPayText) {
        btnPayText.textContent = `Pay ₹${amountVal.toLocaleString('en-IN')} with Razorpay`;
      }
    }
  }

  function showAlert(type, message) {
    if (!alertBox) return;
    alertBox.className = `payment-alert ${type}`;
    alertBox.style.display = 'flex';

    if (alertIcon) {
      if (type === 'error') {
        alertIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
      } else if (type === 'warning') {
        alertIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
      } else {
        alertIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
      }
    }
    if (alertMessage) alertMessage.textContent = message;
    alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideAlert() {
    if (alertBox) alertBox.style.display = 'none';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const amountInput = document.getElementById('feeAmount');
    const studentNameInput = document.getElementById('studentName');
    const studentPhoneInput = document.getElementById('studentPhone');
    const studentEmailInput = document.getElementById('studentEmail');
    const feeTypeSelect = document.getElementById('feeType');
    const playerBatchSelect = document.getElementById('playerBatch');
    const playerRollNoInput = document.getElementById('playerRollNo');
    const paymentNotesInput = document.getElementById('paymentNotes');

    const amountRupees = parseFloat(amountInput?.value);
    const studentName = studentNameInput?.value?.trim();
    const studentPhone = studentPhoneInput?.value?.trim();
    const studentEmail = studentEmailInput?.value?.trim() || '';
    const feeType = feeTypeSelect?.value || 'Academy Fee';
    const playerBatch = playerBatchSelect?.value || '';
    const playerRollNo = playerRollNoInput?.value?.trim() || '';
    const paymentNotes = paymentNotesInput?.value?.trim() || '';

    // Frontend validations
    if (!studentName) {
      showAlert('error', 'Please enter the student or player full name.');
      studentNameInput?.focus();
      return;
    }

    if (!studentPhone || !/^\+?[0-9\s-]{10,14}$/.test(studentPhone.replace(/\s+/g, ''))) {
      showAlert('error', 'Please enter a valid 10-digit mobile number for transaction notifications.');
      studentPhoneInput?.focus();
      return;
    }

    if (isNaN(amountRupees) || amountRupees < 1) {
      showAlert('error', 'Please enter a valid amount of at least ₹1.00.');
      amountInput?.focus();
      return;
    }

    // Convert amount to paise (1 INR = 100 paise)
    const amountInPaise = Math.round(amountRupees * 100);

    // Check if Razorpay script is loaded
    if (typeof window.Razorpay === 'undefined') {
      showAlert(
        'error',
        'Razorpay Checkout SDK is still loading. Please verify your internet connection and refresh the page.'
      );
      return;
    }

    setButtonLoading(true, 'Creating Secure Order...');

    try {
      // 1. BACKEND STEP 1: Call /api/create-order
      const orderPayload = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: `gfc_fee_${Date.now()}`,
        notes: {
          student_name: studentName,
          phone: studentPhone,
          email: studentEmail,
          fee_type: feeType,
          batch: playerBatch,
          roll_no: playerRollNo,
          notes: paymentNotes,
        },
      };

      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      });

      const orderData = await response.json();

      if (!response.ok || !orderData.order_id) {
        throw new Error(orderData.error || orderData.details || 'Failed to initialize payment order on server.');
      }

      setButtonLoading(true, 'Opening Payment Gateway...');

      // 2. FRONTEND STEP 2: Configure Razorpay Checkout Modal
      const razorpayKey =
        orderData.key_id ||
        (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_RAZORPAY_KEY_ID);

      const options = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Gurukul Football Club',
        description: `${feeType} - ${studentName}`,
        image: '/assets/gurukul-logo.png',
        order_id: orderData.order_id,
        prefill: {
          name: studentName,
          email: studentEmail,
          contact: studentPhone,
          method: 'upi',
        },
        notes: {
          student_name: studentName,
          fee_type: feeType,
          batch: playerBatch,
        },
        theme: {
          color: '#0ea5e9', // Gurukul Sky Blue brand color
          backdrop_color: 'rgba(6, 9, 14, 0.85)',
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: 'Pay with UPI (Google Pay, PhonePe, Paytm)',
                instruments: [
                  {
                    method: 'upi',
                    flows: ['intent', 'qr'],
                  },
                ],
              },
            },
            sequence: ['block.upi'],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
        // Success Handler
        handler: async function (razorpayResponse) {
          setButtonLoading(true, 'Verifying Payment...');

          try {
            // 3. BACKEND STEP 3: Verify Payment Signature
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_signature: razorpayResponse.razorpay_signature,
              }),
            });

            const verifyResult = await verifyRes.json();

            if (verifyRes.ok && verifyResult.success) {
              // Signature authentic! Show official receipt
              window.displayPaymentReceipt({
                paymentId: razorpayResponse.razorpay_payment_id,
                orderId: razorpayResponse.razorpay_order_id,
                amount: amountRupees.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }),
                studentName,
                playerBatch,
                playerRollNo,
                paymentNotes,
                feeType,
                phone: studentPhone,
                email: studentEmail,
                date: new Date().toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }),
              });
            } else {
              showAlert(
                'error',
                `Verification failed: ${verifyResult.error || 'Invalid signature. Please contact academy staff with Payment ID: ' + razorpayResponse.razorpay_payment_id}`
              );
            }
          } catch (verifyError) {
            console.error('Payment verification error:', verifyError);
            showAlert(
              'error',
              `Payment verification request failed: ${verifyError.message}. Contact academy support.`
            );
          } finally {
            setButtonLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setButtonLoading(false);
            showAlert('warning', 'Payment modal closed. The transaction was cancelled by user.');
          },
        },
      };

      const rzpInstance = new window.Razorpay(options);

      // Handle failed payments
      rzpInstance.on('payment.failed', function (failResp) {
        setButtonLoading(false);
        const reason = failResp.error?.description || failResp.error?.reason || 'Transaction failed.';
        showAlert('error', `Payment Failed: ${reason} (Code: ${failResp.error?.code || 'PAY_FAILED'})`);
      });

      rzpInstance.open();
    } catch (err) {
      console.error('Checkout error:', err);
      setButtonLoading(false);
      showAlert('error', err.message || 'An unexpected error occurred while setting up payment.');
    }
  });
}

/* --------------------------------------------------------------------------
   Receipt Modal & Print Handler
   -------------------------------------------------------------------------- */
function initReceiptModal() {
  const modal = document.getElementById('receiptModal');
  const backdrop = document.getElementById('receiptBackdrop');
  const closeBtn = document.getElementById('closeReceiptBtn');
  const printBtn = document.getElementById('printReceiptBtn');

  if (!modal) return;

  window.displayPaymentReceipt = function (data) {
    const elReceiptNo = document.getElementById('receiptNo');
    const elDate = document.getElementById('receiptDate');
    const elName = document.getElementById('receiptStudentName');
    const elBatch = document.getElementById('receiptBatch');
    const elRollNo = document.getElementById('receiptRollNo');
    const elRollRow = document.getElementById('receiptRollRow');
    const elPhone = document.getElementById('receiptPhone');
    const elEmail = document.getElementById('receiptEmail');
    const elEmailRow = document.getElementById('receiptEmailRow');
    const elFeeType = document.getElementById('receiptFeeType');
    const elNotes = document.getElementById('receiptNotes');
    const elNotesRow = document.getElementById('receiptNotesRow');
    const elPaymentId = document.getElementById('receiptPaymentId');
    const elOrderId = document.getElementById('receiptOrderId');
    const elTableFeePurpose = document.getElementById('tableFeePurpose');
    const elTableBatch = document.getElementById('tableBatch');
    const elTableBaseAmount = document.getElementById('tableBaseAmount');
    const elAmount = document.getElementById('receiptAmount');

    // Generate clean voucher ID from payment ID
    const shortCode = (data.paymentId || '').replace(/^pay_/, '').slice(-6).toUpperCase() || Math.floor(100000 + Math.random() * 900000);
    if (elReceiptNo) elReceiptNo.textContent = `GFC-26-${shortCode}`;
    if (elDate) elDate.textContent = data.date;
    if (elName) elName.textContent = data.studentName;
    if (elBatch) elBatch.textContent = data.playerBatch || 'Academy Trainee';
    if (elFeeType) elFeeType.textContent = data.feeType;
    if (elPhone) elPhone.textContent = data.phone;
    if (elPaymentId) elPaymentId.textContent = data.paymentId;
    if (elOrderId) elOrderId.textContent = data.orderId;
    if (elAmount) elAmount.textContent = data.amount;
    if (elTableBaseAmount) elTableBaseAmount.textContent = `₹${data.amount}`;
    if (elTableFeePurpose) elTableFeePurpose.textContent = data.feeType;
    if (elTableBatch) elTableBatch.textContent = data.playerBatch || 'Academy Player';

    if (data.playerRollNo && elRollNo && elRollRow) {
      elRollNo.textContent = data.playerRollNo;
      elRollRow.style.display = 'flex';
    } else if (elRollRow) {
      elRollRow.style.display = 'none';
    }

    if (data.email && elEmail && elEmailRow) {
      elEmail.textContent = data.email;
      elEmailRow.style.display = 'flex';
    } else if (elEmailRow) {
      elEmailRow.style.display = 'none';
    }

    if (data.paymentNotes && elNotes && elNotesRow) {
      elNotes.textContent = data.paymentNotes;
      elNotesRow.style.display = 'flex';
    } else if (elNotesRow) {
      elNotesRow.style.display = 'none';
    }

    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  function closeModal() {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (backdrop) backdrop.addEventListener('click', closeModal);
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      closeModal();
      // Reset form for new payment
      const form = document.getElementById('feePaymentForm');
      if (form) form.reset();
      const amountInput = document.getElementById('feeAmount');
      if (amountInput) {
        amountInput.value = '0';
        amountInput.dispatchEvent(new Event('input'));
      }
    });
  }

  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
}
