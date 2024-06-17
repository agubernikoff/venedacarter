// import plan from '../../public/insurancePlan';
// import SkipProduct from '../../public/skipProduct';
import {CartForm} from '@shopify/hydrogen';
import {useEffect, useRef, useState} from 'react';
import Cookies from 'universal-cookie';

const cookies = new Cookies();

export function SimplyWidget({cart, insurancePlan, SkipProduct}) {
  // declaring states
  const [toggle, setToggle] = useState(true);
  const [simplyCounter, setSimplyCounter] = useState(0);

  // declaring Ref
  const addRef = useRef(null);
  const removeRef = useRef(null);
  const insuranceDiv = useRef(null);
  const plan_desc_opt_in = useRef(null);
  const plan_desc_opt_out = useRef(null);
  const switchBtn = useRef(null);

  // declaring global variables
  // let insurancePlan = plan.insurancePlan
  let simplyInsurance = {};
  simplyInsurance.insurancePlan = insurancePlan;
  simplyInsurance.SkipProduct = SkipProduct;
  simplyInsurance.skipSkus = simplyInsurance.SkipProduct.sku;
  simplyInsurance.skipHandles = simplyInsurance.SkipProduct.handle;
  let eligible = false;
  //   let switchInput = '.cart-insurance-input';
  let insurance_auto_enable =
    simplyInsurance.insurancePlan.insurance_auto_enable;
  let currentPlan;
  let skipSkus = simplyInsurance.skipSkus ? simplyInsurance.skipSkus : [];
  let skipHandles = simplyInsurance.skipHandles
    ? simplyInsurance.skipHandles
    : [];
  let skipPids = simplyInsurance.skipPids ? simplyInsurance.skipPids : [];
  // let checkoutPage = 0;
  let minOrderValue = simplyInsurance.minOrderValue
    ? simplyInsurance.minOrderValue
    : 0;
  let lines = [];
  let removeLines = [];

  useEffect(() => {
    const autoAddProduct = () => {
      let insuranceProducts = getInsuranceProduct();
      if (insuranceProducts.length == 0) {
        let input = switchBtn.current;
        if (input && !input.checked) {
          switchOnInsurance(true);
          addRef.current.click();
        }
      }
    };
    if (insurance_auto_enable && !getCookie('insuranceRemoved')) {
      autoAddProduct();
    }
  }, []);

  useEffect(() => {
    switchCheck();
    const updateInsuranceProduct = () => {
      let filterItems = skipProducts();
      let cartTotal = 0;

      filterItems.forEach((item) => {
        cartTotal = cartTotal + parseFloat(item.cost.totalAmount.amount) * 100;
      });

      let insuranceProducts = getInsuranceProduct();

      if (cartTotal === 0 || minOrderValue > cartTotal) {
        if (insuranceProducts.length > 0) {
          removeInsuranceProduct();
          if (removeRef.current) {
            removeRef.current.click();
          }
        }
      } else {
        if (!insuranceProducts || insuranceProducts.length === 0) {
          if (toggle === true && simplyCounter != 0) {
            addInsuranceProduct();
            if (addRef.current) {
              addRef.current.click();
            }
          }
        } else if (insuranceProducts.length > 1) {
          setSimplyCounter(1);
          // removeInsuranceProduct();
          if (removeRef.current) {
            removeRef.current.click();
          }
        } else {
          let exsistingPlan = insuranceProducts[0];
          const exsistingPlan_variant_id = getProductId(exsistingPlan);
          const qty = exsistingPlan.quantity;

          if (
            exsistingPlan &&
            exsistingPlan_variant_id != currentPlan.variant_id
          ) {
            setSimplyCounter(1);
            // removeInsuranceProduct();
            if (removeRef.current) {
              removeRef.current.click();
            }
          }
        }
        return true;
      }
    };
    updateInsuranceProduct();
  }, [cart]);

  const setCookie = function (cname, cvalue, exdays) {
    const expires = new Date(Date.now() + exdays * 24 * 60 * 60 * 1000);
    cookies.set(cname, cvalue, {path: '/', expires});
  };

  const getCookie = function (cname) {
    let insuranceCookie = cookies.get(cname);
    return insuranceCookie;
  };

  const convertMoneyToCents = (money) => {
    try {
      money = parseFloat(money).toFixed(2);
      money = money * 100;
      return money;
    } catch (e) {
      return money;
    }
  };

  const getProductId = (item) => {
    let merchandiseId = item.merchandise.id;
    let variantId = merchandiseId.replace('gid://shopify/ProductVariant/', '');
    let id = parseInt(variantId);
    return id;
  };

  const switchOnInsurance = (b) => {
    let elements = [plan_desc_opt_in.current, plan_desc_opt_out.current];

    if (elements.length > 0) {
      elements.forEach((element) => {
        if (element) {
          element.classList.add('hide');
        }
      });

      if (b) {
        let ele = plan_desc_opt_out.current;
        if (ele) {
          ele.classList.remove('hide');
        }
      } else {
        let ele = plan_desc_opt_in.current;
        if (ele) {
          ele.classList.remove('hide');
        }
      }

      if (switchBtn.current) {
        switchBtn.current.checked = b;
      }
    }
  };

  const addInsuranceProduct = () => {
    switchOnInsurance(true);
  };

  const removeInsuranceProduct = () => {
    switchOnInsurance(false);
  };

  const filterInsuranceProduct = () => {
    let items = [];
    if (cart) {
      items = cart.lines.nodes.filter((item) => {
        let variant_id = getProductId(item);

        const plans = insurancePlan.planArray;
        let currentPlan = plans.find((plan) => plan.variant_id == variant_id);

        if (!currentPlan) {
          return true;
        } else return false;
      });
    }
    return items;
  };

  const skipProducts = () => {
    let filter_items = filterInsuranceProduct();
    let items = filter_items.filter(
      (item) =>
        skipSkus.indexOf(item.sku) == -1 &&
        skipPids.indexOf(item.product_id) == -1 &&
        skipHandles.indexOf(item.handle) == -1,
    );
    return items;
  };

  const planTypeFixed = (cartTotal) => {
    let planArray = simplyInsurance.insurancePlan.planArray;
    planArray.forEach((plan) => {
      let min_order_price = convertMoneyToCents(plan.min_order_price);
      let max_order_price = convertMoneyToCents(plan.max_order_price);
      if (cartTotal > min_order_price && cartTotal <= max_order_price) {
        currentPlan = plan;
        eligible = true;
      }
    });
    if (!eligible) {
      planArray.forEach((plan) => {
        let iplan_global = plan.is_gloabal_rule;
        if (iplan_global == 'Yes') {
          currentPlan = plan;
          eligible = true;
        }
      });
    }
  };

  const planTypePercentage = (cartTotal) => {
    let insurancePlan = simplyInsurance.insurancePlan;
    let percentage = insurancePlan.cart_percentage;
    let planArray = insurancePlan.planArray;
    let percentageOfTotal = (cartTotal * parseFloat(percentage)) / 100;
    let selectedPlan;

    for (let i = 0; i < planArray.length; i++) {
      let currPlan = planArray[i];
      let prevPlan = planArray[i];
      if (!selectedPlan) {
        selectedPlan = currPlan;
      } else {
        prevPlan = selectedPlan;
      }
      let currPrice = convertMoneyToCents(currPlan.insurance_plan_amount);
      let prevPrice = convertMoneyToCents(prevPlan.insurance_plan_amount);
      let diffTwo = Math.abs(currPrice - percentageOfTotal);
      let diffOne = Math.abs(prevPrice - percentageOfTotal);
      selectedPlan = diffOne > diffTwo ? currPlan : prevPlan;
    }
    if (selectedPlan) {
      currentPlan = selectedPlan;
    } else {
      currentPlan = planArray[planArray.length - 1];
    }
    eligible = true;
  };

  const getInsuranceProduct = () => {
    let items = [];
    if (cart) {
      items = cart.lines.nodes.filter((item) => {
        let variant_id = getProductId(item);

        const plans = simplyInsurance.insurancePlan.planArray;
        let currentPlan = plans.find((plan) => plan.variant_id == variant_id);
        if (currentPlan) {
          return true;
        } else return false;
      });
    }
    return items;
  };

  const checkEligibility = () => {
    let insurancePlan = simplyInsurance.insurancePlan;
    let filterItems = skipProducts();
    let cartTotal = 0;

    filterItems.forEach((item) => {
      cartTotal = cartTotal + parseFloat(item.cost.totalAmount.amount) * 100;
    });

    if (cartTotal === 0) {
      return;
    }
    if (minOrderValue > cartTotal) {
      return;
    }
    if (insurancePlan.insurance_plan_type == 'percentage') {
      planTypePercentage(cartTotal);
    } else {
      planTypeFixed(cartTotal);
    }
  };

  const switchCheck = () => {
    let insuranceItems = getInsuranceProduct();
    if (insuranceItems.length > 0) {
      switchOnInsurance(true);
    } else {
      switchOnInsurance(false);
    }
  };

  const init = () => {
    if (insurancePlan && insurancePlan.is_app_enable === 'no') {
      return;
    }
    checkEligibility();
    if (!eligible) {
      return;
    }
  };

  const insuranceSwitchButton = () => {
    let input = switchBtn.current;
    input.click();
    if (input.checked) {
      setToggle(true);
      setCookie('insuranceRemoved', 'true', -1);
      addInsuranceProduct();
      addRef.current.click();
    } else {
      setToggle(false);
      setCookie('insuranceRemoved', 'true', 1);
      removeInsuranceProduct();
      removeRef.current.click();
    }
  };

  const getCurrencyCode = () => {
    let items = filterInsuranceProduct();
    if (items.length > 0) {
      let moneyV2 = items[0].cost.totalAmount;
      return moneyV2.currencyCode;
    }
    return null;
  };
  const transformToCurrencyIcon = (type) => {
    if (type) {
      if (type === 'INR') {
        return '₹';
      } else if (type === 'USD') {
        return '$';
      }
    }
    return null;
  };
  let currencyIcon = transformToCurrencyIcon(getCurrencyCode());

  init();
  if (currentPlan) {
    lines = [
      {
        merchandiseId: `gid://shopify/ProductVariant/${currentPlan.variant_id}`,
        quantity: 1,
      },
    ];
  }

  let products = getInsuranceProduct();
  if (products.length > 0) {
    products.forEach((product) => {
      let obj = {id: product.id, quantity: 0};
      removeLines.push(obj);
    });
  }

  return (
    <>
      <div className="si-widget">
        <div
          className="simply-insurance widget design1 loaded rendered"
          ref={insuranceDiv}
        >
          <div className="header-wrap">
            <div className="title-image-wrap">
              {insurancePlan.widget_image_url && (
                <img src={insurancePlan.widget_image_url} alt="widget" />
              )}
              <div className="insurance-title-wrap">
                <p className="plan_title">
                  {insurancePlan.insurance_plan_title}
                  {/* <i className="btnCstm tooltipCstm">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 15 15"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7.5 0C3.36433 0 0 3.36433 0 7.5C0 11.6357 3.36433 15 7.5 15C11.6357 15 15 11.6357 15 7.5C15 3.36433 11.6357 0 7.5 0ZM7.5 11.875C7.15496 11.875 6.87504 11.595 6.87504 11.25C6.87504 10.905 7.15496 10.625 7.5 10.625C7.84504 10.625 8.12496 10.905 8.12496 11.25C8.12496 11.595 7.84504 11.875 7.5 11.875ZM8.48934 7.90123C8.26813 8.00308 8.12496 8.22624 8.12496 8.46943V8.75004C8.12496 9.09496 7.84561 9.375 7.5 9.375C7.15439 9.375 6.87504 9.09496 6.87504 8.75004V8.46943C6.87504 7.73998 7.30373 7.0713 7.96566 6.76563C8.60252 6.47255 9.06246 5.69435 9.06246 5.31246C9.06246 4.45129 8.36185 3.75 7.5 3.75C6.63815 3.75 5.93754 4.45129 5.93754 5.31246C5.93754 5.6575 5.65807 5.93754 5.31246 5.93754C4.96685 5.93754 4.6875 5.6575 4.6875 5.31246C4.6875 3.7619 5.94933 2.49996 7.5 2.49996C9.05067 2.49996 10.3125 3.7619 10.3125 5.31246C10.3125 6.15692 9.57996 7.39815 8.48934 7.90123Z"
                        fill="#212B36"
                      ></path>
                    </svg>
                    <span className="toolltiptextCstm">
                      {insurancePlan.tool_tip_message}
                    </span>
                  </i> */}
                </p>
                <p className="plan_subtitle">
                  {insurancePlan.widget_subtitle.includes('##plan_price')
                    ? insurancePlan.widget_subtitle.replace('##plan_price', '')
                    : insurancePlan.widget_subtitle}
                  <span className="insurance_plan">
                    {currencyIcon && <span>{currencyIcon}</span>}
                    {currentPlan ? currentPlan.insurance_plan_amount : ''}
                  </span>
                </p>
              </div>
            </div>

            <CartForm
              route="/cart"
              inputs={{lines}}
              action={CartForm.ACTIONS.LinesAdd}
            >
              <button
                ref={addRef}
                type="submit"
                style={{display: 'none'}}
              ></button>
            </CartForm>

            <CartForm
              route="/cart"
              inputs={{lines: removeLines}}
              action={CartForm.ACTIONS.LinesUpdate}
            >
              <button
                ref={removeRef}
                aria-label="Decrease quantity"
                name="decrease-quantity"
                value={0}
                type="submit"
                style={{display: 'none'}}
              ></button>
            </CartForm>

            <div className="switch-button">
              <input
                ref={switchBtn}
                hidden="hidden"
                className="cart-insurance-input"
                type="checkbox"
              />
              <label
                className="switch"
                htmlFor="cart-insurance-input"
                onClick={insuranceSwitchButton}
              ></label>
            </div>
          </div>
          <p ref={plan_desc_opt_in} className="plan-description opt-in">
            {insurancePlan.opt_in_message}
          </p>
          <p ref={plan_desc_opt_out} className="plan-description opt-out hide">
            {insurancePlan.opt_out_message}
          </p>
        </div>
      </div>
    </>
  );
}
